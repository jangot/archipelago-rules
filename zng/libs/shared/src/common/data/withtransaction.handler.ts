import { Logger } from '@nestjs/common';
import { runOnTransactionCommit, runOnTransactionRollback, runOnTransactionComplete } from 'typeorm-transactional';

/**
 * A generic wrapper for handling commit, rollback, and completion in @Transactional methods.
 * @param transactionalFunction - The transactional function to execute.
 * @param logger - Optional Logger if you want more logs to parse through
 * @returns A promise that resolves on commit and rejects on rollback or error.
 */
export async function withTransactionHandler<T>(
  transactionalFunction: () => Promise<T>,
  logger?: Logger
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    (async () => {
      try {
        const result = await transactionalFunction();

        // Need to resolve immediately, since if we don't do this this function never completes
        // Rollbacks will still trigger the reject(error) below and do the right thing
        resolve(result);

        runOnTransactionCommit(() => {
          logger?.debug('Transaction committed', result);
        });

        runOnTransactionRollback((error) => {
          logger?.error('Transaction rolled back', error);
          reject(error);
        });
        
        // I don't think this is necessary, but it's here for completeness
        // runOnTransactionComplete((error) => {
        //   logger?.debug('Transaction completed');

        //   error ? reject(error) : resolve(result);
        // });
      } catch (error) {
        reject(error); // Ensure rejection on failure
      }
    })();
  });
}
