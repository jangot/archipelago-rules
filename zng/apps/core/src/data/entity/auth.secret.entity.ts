import { IAuthSecret } from '@library/entity/interface';
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
import { AuthSecretType } from '@library/entity/enum';

@Entity('auth_secrets', { schema: 'core' })
@Unique('auth_secrets_user_id_per_type_unique', ['ownuserIderId', 'type'])
export class AuthSecret implements IAuthSecret {
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
  expiresAt?: Date | undefined;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt?: Date | undefined;
}
