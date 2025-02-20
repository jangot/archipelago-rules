import { IApplicationUser } from '@library/entity/interface';
import { Entity, PrimaryGeneratedColumn, Column, DeleteDateColumn } from 'typeorm';

// Thoughts to consider
// Should we add additional `normalized` versions of some of these fields to the Database?
// For example, we could add a `normalized` version of both the email and phoneNumber fields
// for the email field we could lower case the value and store it that way. It makes it easier to look up an email without considering casing
// We could also normalize the phone number the user entered by using the phone npm module and store it in a consistent format
// while also keeping the originally entered value
// Things to consider...
@Entity('users', { schema: 'core' })
export class ApplicationUser implements IApplicationUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  firstName: string;

  @Column('text')
  lastName: string;

  @Column('text', { unique: true })
  email: string;

  @Column('text')
  phoneNumber: string;

  @DeleteDateColumn({ type: 'timestamp with time zone' })
  deletedAt?: Date | null;
}
