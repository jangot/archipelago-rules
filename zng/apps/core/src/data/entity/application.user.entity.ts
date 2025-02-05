import { IApplicationUser } from '@library/entity/interface';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class ApplicationUser implements IApplicationUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phoneNumber: string;
}
