import { AuthSecretType, IAuthSecret } from '@library/entity/interface';
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

@Entity('auth_secrets', { schema: 'core' })
@Unique('auth_secrets_owner_id_per_type_unique', ['ownerId', 'type'])
export class AuthSecret implements IAuthSecret {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: AuthSecretType }) // Not sure that it is the best way for enums
  type: AuthSecretType;

  @Column('uuid')
  ownerId: string;

  @ManyToOne(() => ApplicationUser)
  @JoinColumn({ name: 'owner_id' })
  owner: ApplicationUser;

  @Column('text')
  secret: string;

  @Column('timestamp with time zone', { nullable: true })
  expiresAt?: Date | undefined;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt?: Date | undefined;
}
