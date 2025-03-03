import { RegistrationStage, RegistrationType } from '@library/entity/enum';
import { IRegistration } from '@library/entity/interface';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('registrations', { schema: 'core' })
export class Registration implements IRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', enum: RegistrationType })
  type: RegistrationType;

  @Column({ type: 'text' })
  stage: RegistrationStage;

  @Column({ type: 'text', nullable: true })
  data?: string;

  @Column({ type: 'text', nullable: true })
  secret?: string;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'integer', nullable: true })
  retries?: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  unlocksAt?: Date;
}
