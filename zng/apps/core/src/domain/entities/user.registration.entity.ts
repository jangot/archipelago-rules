import { RegistrationStatus } from '@library/entity/enum/registration.status';
import { IUserRegistration } from '@library/entity/interface';
import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { ApplicationUser } from './application.user.entity';

@Entity('user_registrations', { schema: 'core' })
@Unique('registrations_per_user_id_unique', ['id', 'userId'])
export class UserRegistration implements IUserRegistration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @OneToOne(() => ApplicationUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: ApplicationUser;

  @Column({ type: 'text' })
  status: RegistrationStatus;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @Column('text', { nullable: true })
  secret: string | null;

  @Column('timestamp with time zone', { nullable: true })
  secretExpiresAt: Date | null;
}
