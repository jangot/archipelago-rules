import { IFileStorageProvider } from '@library/shared/common/providers/ifile-storage.provider';
import { Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import { createInterface } from 'readline';
import { PassThrough, Readable, Transform } from 'stream';

/**
 * Interface for biller address records (Record type 1)
 * Contains from 1 to 20 addresses per record
 */
interface Address {
  recordType: string;
  addressKey: string | null;
  recordEffectiveDate: string | null;
  addressType: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  stateProvinceCode: string | null;
  countryCode: string | null;
  postalCode: string | null;
}

/**
 * Interface for biller mask records (Record type 2)
 * Contains from 1 to 80 masks for full/partial downloads, 1 to 60 for advanced full download
 * Each record may contain from 1 to 50 masks
 */
interface Mask {
  recordType: string;
  maskKey: string | null;
  recordEffectiveDate: string | null;
  maskLength: string | null;
  mask: string | null;
  // exceptionMask is deleted in the processing logic
}

/**
 * Interface for biller AKA records (Record type 4)
 * Contains from 1 to 15 AKAs per record
 */
interface Aka {
  recordType: string;
  akaKey: string | null;
  recordEffectiveDate: string | null;
  akaName: string | null;
}
/**
 * Interface for biller object containing all related records
 */
interface BillerObj {
  [key: string]: any;
  recordType: string;
  addresses: Address[];
  masks: Mask[];
  akas: Aka[];
}

const billerFieldsToDelete = [
  'transitRoutingNumber', 'fileFormat', 'acceptsPrenotes', 'acceptsDmpPrenotes',
  'acceptsDmpPaymentsOnly', 'averageResponseTimeHours',
  'acceptCdpprenotes', 'acceptCdvprenotes', 'acceptCddprenotes',
  'acceptCdfprenotes', 'acceptCdnprenotes', 'acceptFbdprenotes',
  'acceptFbcprenotes', 'returnCdr', 'returnCdt', 'returnCda',
  'returnCdv', 'returnCdc', 'returnCdm', 'requireAddendaWithReversals',
  'countryCode', 'stateProvinceCode', 'checkDigitRoutine', 'currencyCode',
  'acceptsExceptionPayments', 'sameDayPaymentDeadlineCycle',
  'totalAddresses', 'totalMasks', 'totalAkas', 'totalContacts',
];

const specs: { [key: string]: string[] } = {
  '0': [
    'recordType', 'billerKey', 'recordEffectiveDate', 'billerId', 'liveDate',
    'transitRoutingNumber', 'billerName', 'billerClass', 'billerType',
    'lineOfBusiness', 'fileFormat', 'acceptsPrenotes',
    'acceptsGuaranteedPaymentsOnly', 'acceptsDmpPrenotes',
    'acceptsDmpPaymentsOnly', 'averageResponseTimeHours',
    'acceptCdpprenotes', 'acceptCdvprenotes', 'acceptCddprenotes',
    'acceptCdfprenotes', 'acceptCdnprenotes', 'acceptFbdprenotes',
    'acceptFbcprenotes', 'returnCdr', 'returnCdt', 'returnCda', 'returnCdv',
    'returnCdc', 'returnCdm', 'requireAddendaWithReversals', 'countryCode',
    'stateProvinceCode', 'checkDigitRoutine', 'currencyCode', 'territoryCode',
    'previousBillerName',
    //'note',
    'acceptsExceptionPayments',
    'sameDayPaymentDeadlineCycle', 'totalAddresses', 'totalMasks',
    'totalAkas', 'totalContacts',
  ],
  '1': [
    'recordType', 'addressKey', 'recordEffectiveDate', 'addressType',
    'addressLine1', 'addressLine2', 'city', 'stateProvinceCode',
    'countryCode', 'postalCode',
  ],
  '2': [
    'recordType', 'maskKey', 'recordEffectiveDate', 'maskLength',
    'mask', 'exceptionMask',
  ],
  '3': [
    'recordType', 'billerMaskDescriptorKey', 'recordEffectiveDate',
    'maskDescriptor',
  ],
  '4': [
    'recordType', 'akaKey', 'recordEffectiveDate', 'akaName',
  ],
  '5': [
    'recordType', 'contactKey', 'recordEffectiveDate', 'contactType',
    'organizationName', 'courtesyTitle', 'firstName', 'lastName', 'title',
    'addressLine1', 'addressLine2', 'city', 'stateProvinceCode',
    'countryCode', 'postalCode', 'email',
  ],
  '6': [
    'recordType', 'phoneKey', 'recordEffectiveDate', 'phoneType', 'phoneNumber',
  ],
  'X0': [
    'acdIndicator', 'effectiveDate',
  ],
};

/**
 * RppsFileProcessor handles parsing of RPPS biller TXT files to a JSON file.
 */
@Injectable()
export class RppsFileProcessor {
  private readonly logger: Logger = new Logger(RppsFileProcessor.name);

  /**
   * Parses the RPPS TXT file stream and writes a JSON file to storage.
   * Streams individual billers to reduce memory usage for large files.
   * @param txtFileStream The original TXT file as a stream
   * @param outputBasePath The base path for output
   * @param fileStorage The file storage service to use
   * @returns The path to the written JSON file
   */
  public async parseBillersFile(txtFileStream: Readable, outputBasePath: string, fileStorage: IFileStorageProvider): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    const jsonFileName = `rpps-billers-${dateStr}.json`;
    const jsonFilePath = join(outputBasePath, jsonFileName);

    this.logger.log(`Starting RPPS file processing. Output path: ${jsonFilePath}`);

    // Create a pass-through stream to handle backpressure properly
    const outputStream = new PassThrough();
    
    // Create a transform stream that will handle the JSON formatting
    const jsonTransformStream = new Transform({
      objectMode: true,
      transform(chunk: any, encoding: string, callback: (error?: Error | null) => void) {
        try {
          if (chunk.type === 'start') {
            this.push('[\n');
          } else if (chunk.type === 'biller') {
            const prefix = chunk.isFirst ? '' : ',\n';
            this.push(prefix + JSON.stringify(chunk.data));
          } else if (chunk.type === 'end') {
            this.push('\n]');
          }
          callback();
        } catch (error) {
          callback(error as Error);
        }
      },
    });

    // Handle transform stream errors
    jsonTransformStream.on('error', (error) => {
      this.logger.error('JSON transform stream error:', error);
      outputStream.destroy(error);
    });

    // Pipe the transform stream to the output stream
    jsonTransformStream.pipe(outputStream);

    // Handle output stream errors
    outputStream.on('error', (error) => {
      this.logger.error('Output stream error:', error);
    });

    try {
      // Read lines from the stream
      const readLine = createInterface({ input: txtFileStream, crlfDelay: Infinity });
      let currentBiller: BillerObj | null = null;
      let currentAddresses: Address[] = [];
      let currentPreviousAddresses: Address[] = [];
      let isFirstBiller = true;
      let lineNumber = 0;
      let billerCount = 0;
      let errorCount = 0;
      const logInterval = 1000; // Log progress every 1000 billers

      // Start the JSON array
      jsonTransformStream.write({ type: 'start' });

      for await (const line of readLine) {
        lineNumber++;
        
        if (!line.trim().length) continue;


        // Validate line length to prevent memory attacks
        if (line.length > 10000) {
          this.logger.error(`Line ${lineNumber} too long: ${line.length} characters`);
          errorCount++;
          continue;
        }

        try {
          const colsRaw = line.split('\t');
          const cols = (colsRaw[colsRaw.length - 1] === '') ? colsRaw.slice(0, -1) : colsRaw;
          
          // Validate minimum column count
          if (cols.length < 2) {
            this.logger.error(`Line ${lineNumber} has insufficient columns: ${cols.length}`);
            errorCount++;
            continue;
          }

          const typeKey = cols[0] === 'X0' ? 'X0' : cols[0];
          const headers = specs[typeKey];
          
          if (!headers) {
            const error = `Unknown record type "${typeKey}" in line ${lineNumber}:\n${line}`;
            this.logger.error(error);
            errorCount++;
            continue; // Skip this line and continue processing
          }

          const fieldNames = headers.slice(1);
          const chunkSize = fieldNames.length;
          const values = cols.slice(1);
          
          // Validate that values array length is divisible by chunkSize
          if (values.length % chunkSize !== 0) {
            this.logger.error(`Line ${lineNumber} has invalid column count: ${values.length} not divisible by ${chunkSize}`);
            errorCount++;
            continue;
          }

          const recordCount = values.length / chunkSize;

          // Limit record count to prevent memory attacks
          const maxRecordsPerLine = 100;
          if (recordCount > maxRecordsPerLine) {
            this.logger.error(`Line ${lineNumber} has too many records: ${recordCount} exceeds limit ${maxRecordsPerLine}`);
            errorCount++;
            continue;
          }

          for (let i = 0; i < recordCount; i++) {
            try {
              const rec: any = { recordType: typeKey };
              const sliceStart = i * chunkSize;
              fieldNames.forEach((name, j) => {
                const value = values[sliceStart + j];
                // Validate field values - prevent injection attacks
                if (value && typeof value === 'string') {
                  // Limit field length to prevent memory attacks
                  if (value.length > 1000) {
                    this.logger.warn(`Field ${name} at record ${i} in line ${lineNumber} too long: ${value.length} characters`);
                    rec[name] = value.substring(0, 1000); // Truncate instead of fail
                  } else {
                    rec[name] = value.trim() || null;
                  }
                } else {
                  rec[name] = null;
                }
              });

              switch (typeKey) {
                case '0':
                  // Write the previous biller to the stream if it exists
                  if (currentBiller) {
                    if (currentAddresses.length > 0) {
                      currentBiller.addresses = currentAddresses;
                    } else if (currentPreviousAddresses.length > 0) {
                      currentBiller.addresses = currentPreviousAddresses;
                    } else {
                      currentBiller.addresses = [];
                    }
                    
                    // Stream the biller
                    jsonTransformStream.write({ 
                      type: 'biller', 
                      data: currentBiller, 
                      isFirst: isFirstBiller, 
                    });
                    billerCount++;
                    isFirstBiller = false;
                    
                    // Log progress at intervals
                    if (billerCount % logInterval === 0) {
                      this.logger.log(`Processed ${billerCount} billers so far...`);
                    }
                  }
                  
                  // Start a new biller
                  currentBiller = { ...rec, addresses: [], masks: [], akas: [] };
                  for (const field of billerFieldsToDelete) {
                    delete currentBiller![field];
                  }
                  currentAddresses = [];
                  currentPreviousAddresses = [];
                  break;

                case '1':
                  if (!currentBiller) {
                    const error = `Address without a parent biller at line ${lineNumber}`;
                    this.logger.error(error);
                    errorCount++;
                    continue;
                  }
                  if (rec.addressType !== 'Previous') {
                    currentAddresses.push(rec);
                  } else {
                    currentPreviousAddresses.push(rec);
                  }
                  break;

                case '2':
                  if (!currentBiller) {
                    const error = `Mask without a parent biller at line ${lineNumber}`;
                    this.logger.error(error);
                    errorCount++;
                    continue;
                  }
                  delete rec.exceptionMask;
                  currentBiller.masks.push(rec);
                  break;

                case '3':
                case '5':
                case '6':
                  // Skip mask descriptors, contacts and phone/fax numbers silently
                  break;

                case '4':
                  if (!currentBiller) {
                    const error = `AKA without a parent biller at line ${lineNumber}`;
                    this.logger.error(error);
                    errorCount++;
                    continue;
                  }
                  currentBiller.akas.push(rec);
                  break;

                default:
                  this.logger.warn(`Unhandled record type ${typeKey} at line ${lineNumber}`);
                  break;
              }
            } catch (recordError) {
              this.logger.error(`Error processing record ${i} at line ${lineNumber}:`, recordError);
              errorCount++;
            }
          }
        } catch (lineError) {
          this.logger.error(`Error processing line ${lineNumber}:`, lineError);
          errorCount++;
        }
      }
      
      // Write the final biller if it exists
      if (currentBiller) {
        if (currentAddresses.length > 0) {
          currentBiller.addresses = currentAddresses;
        } else if (currentPreviousAddresses.length > 0) {
          currentBiller.addresses = currentPreviousAddresses;
        } else {
          currentBiller.addresses = [];
        }
        
        // Stream the final biller
        jsonTransformStream.write({ 
          type: 'biller', 
          data: currentBiller, 
          isFirst: isFirstBiller, 
        });
        billerCount++;
      }
      
      // End the JSON array and close the transform stream
      jsonTransformStream.write({ type: 'end' });
      jsonTransformStream.end();
      
      this.logger.log(`Successfully processed ${billerCount} billers from ${lineNumber} lines with ${errorCount} errors`);
      
      // Write the output stream to storage
      await fileStorage.writeStream(jsonFilePath, outputStream);
      
      // Properly close the output stream
      outputStream.end();
      
      this.logger.log(`JSON file written successfully to: ${jsonFilePath}`);
      
      return jsonFilePath;
    } catch (error) {
      this.logger.error('Error in parseBillersFile:', error);
      // Ensure streams are properly closed on error
      jsonTransformStream.destroy();
      outputStream.destroy();
      throw error;
    }
  }
} 
