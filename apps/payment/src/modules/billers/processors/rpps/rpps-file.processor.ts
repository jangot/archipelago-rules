import { IFileStorageService } from '@library/shared/common/helper/ifile-storage.service';
import { Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import { createInterface } from 'readline';
import { PassThrough, Readable } from 'stream';

interface Address { recordType: string; [key: string]: string | null; }
interface Mask { recordType: string; [key: string]: string | null; }
interface Aka { recordType: string; [key: string]: string | null; }
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
   * @param txtFileStream The original TXT file as a stream
   * @param outputBasePath The base path for output
   * @param fileStorage The file storage service to use
   * @returns The path to the written JSON file
   */
  public async parseBillersFile(txtFileStream: Readable, outputBasePath: string, fileStorage: IFileStorageService): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10);
    const jsonFileName = `rpps-billers-${dateStr}.json`;
    const jsonFilePath = join(outputBasePath, jsonFileName);

    // Read lines from the stream
    const readLine = createInterface({ input: txtFileStream, crlfDelay: Infinity });
    const billers: BillerObj[] = [];
    let currentBiller: BillerObj | null = null;
    let currentAddresses: Address[] = [];
    let currentPreviousAddresses: Address[] = [];

    for await (const line of readLine) {
      if (!line.trim().length) continue;
      const colsRaw = line.split('\t');
      const cols = (colsRaw[colsRaw.length - 1] === '') ? colsRaw.slice(0, -1) : colsRaw;
      const typeKey = cols[0] === 'X0' ? 'X0' : cols[0];
      const headers = specs[typeKey];
      if (!headers) {
        throw new Error(`Unknown record type "${typeKey}" in line:\n${line}`);
      }
      const fieldNames = headers.slice(1);
      const chunkSize = fieldNames.length;
      const values = cols.slice(1);
      const recordCount = values.length / chunkSize;
      for (let i = 0; i < recordCount; i++) {
        const rec: any = { recordType: typeKey };
        const sliceStart = i * chunkSize;
        fieldNames.forEach((name, j) => {
          rec[name] = values[sliceStart + j]?.trim() || null;
        });
        switch (typeKey) {
          case '0':
            if (currentBiller) {
              if (currentAddresses.length > 0) {
                currentBiller.addresses = currentAddresses;
              } else if (currentPreviousAddresses.length > 0) {
                currentBiller.addresses = currentPreviousAddresses;
              } else {
                currentBiller.addresses = [];
              }
            }
            currentBiller = { ...rec, addresses: [], masks: [], akas: [] };
            for (const field of billerFieldsToDelete) {
              delete currentBiller![field];
            }
            billers.push(currentBiller!);
            currentAddresses = [];
            currentPreviousAddresses = [];
            break;
          case '1':
            if (!currentBiller) throw new Error('Address without a parent biller');
            if (rec.addressType !== 'Previous') {
              currentAddresses.push(rec);
            } else {
              currentPreviousAddresses.push(rec);
            }
            break;
          case '2':
            if (!currentBiller) throw new Error('Mask without a parent biller');
            delete rec.exceptionMask;
            currentBiller.masks.push(rec);
            break;
          case '3':
            break;
          case '4':
            if (!currentBiller) throw new Error('AKA without a parent biller');
            currentBiller.akas.push(rec);
            break;
        }
      }
    }
    if (currentBiller) {
      if (currentAddresses.length > 0) {
        currentBiller.addresses = currentAddresses;
      } else if (currentPreviousAddresses.length > 0) {
        currentBiller.addresses = currentPreviousAddresses;
      } else {
        currentBiller.addresses = [];
      }
    }
    // Write the JSON file using a stream
    const jsonStream = new PassThrough();
    jsonStream.end(Buffer.from(JSON.stringify(billers), 'utf-8'));
    await fileStorage.writeStream(jsonFilePath, jsonStream);
    return jsonFilePath;
  }
} 
