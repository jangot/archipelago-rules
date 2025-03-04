import { ILogin } from '@library/entity/interface';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { ApplicationUser } from './application.user.entity';
import { AuthSecretType, RegistrationStage } from '@library/entity/enum';

@Entity('logins', { schema: 'core' })
@Unique('logins_user_id_per_type_unique', ['userId', 'type'])
export class Login implements ILogin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', enum: AuthSecretType }) // Not sure that it is the best way for enums
  type: AuthSecretType;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => ApplicationUser)
  @JoinColumn({ name: 'user_id' })
  user: ApplicationUser;

  @Column('text')
  secret: string;

  @Column('timestamp with time zone', { nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', nullable: true })
  updatedAt: Date | null;

  @Column({ type: 'text' })
  stage: RegistrationStage;

  @Column('int', { nullable: true })
  attempts: number | null;

  @Column('timestamp with time zone', { nullable: true })
  unlocksAt: Date | null;

  @Column('text', { nullable: true })
  externalId: string | null;

  @Column('text', { nullable: true })
  externalData: string | null;
}
