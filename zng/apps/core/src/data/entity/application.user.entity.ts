import { IApplicationUser } from '@library/entity/interface';
import { Entity, PrimaryGeneratedColumn, Column, AfterLoad } from 'typeorm';

@Entity('users', { schema:'core' })
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
}
