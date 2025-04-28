/* @name bindTargetUserToLoans */
UPDATE core.loans
SET
  borrower_id = CASE
    WHEN borrower_id IS NULL AND lender_id IS NOT NULL THEN :userId
    ELSE borrower_id
  END,
  lender_id = CASE
    WHEN lender_id IS NULL AND borrower_id IS NOT NULL THEN :userId
    ELSE lender_id
  END
WHERE
  target_user_uri = :contactUri
  AND state <> 'created'
  AND (borrower_id IS NULL OR lender_id IS NULL)
RETURNING *;