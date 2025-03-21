import { ILogin } from '@library/entity/interface';
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { ApplicationUser } from './application.user.entity';
import { LoginType } from '@library/entity/enum';

@Entity('user_logins', { schema: 'core' })
@Unique('logins_user_id_per_login_type_unique', ['userId', 'loginType'])
export class Login implements ILogin {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => ApplicationUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: ApplicationUser;

  @Column({ type: 'text' })
  loginType: LoginType;

  @Column('text', { nullable: true })
  secret: string | null;

  @Column('timestamp with time zone', { nullable: true })
  secretExpiresAt: Date | null;

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', nullable: true })
  updatedAt: Date | null;
}
