import { IApplicationUser } from '@library/entity/interface';
import { Entity, PrimaryGeneratedColumn, Column, AfterLoad } from 'typeorm';

@Entity('users')
export class ApplicationUser implements IApplicationUser {
  @PrimaryGeneratedColumn('uuid', {primaryKeyConstraintName: 'users_id_pkey' })
  id: string;

  @Column('text')
  firstName: string;

  @Column('text')
  lastName: string;

  @Column('text', { unique: true })
  email: string;

  @Column('text')
  phoneNumber: string;
}
