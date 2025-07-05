import * as fs from 'fs';
import * as path from 'path';
import { configuration } from './configuration';

const USERS_DB_PATH = configuration.usersDbPath || path.join(process.cwd(), 'data', 'users.json');

export interface User {
    id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    addedAt: string;
    addedBy: string;
    isActive: boolean;
    isAdmin?: boolean;
}

export interface UserDatabase {
    users: User[];
    lastUpdated: string;
    version: string;
}

class UserAccessManager {
    private dbPath: string;
    private database: UserDatabase;

    constructor() {
        this.dbPath = USERS_DB_PATH;
        this.database = this.loadDatabase();
    }

    private loadDatabase(): UserDatabase {
        try {
            // Создаём папку data если её нет
            const dataDir = path.dirname(this.dbPath);
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            // Загружаем базу данных
            if (fs.existsSync(this.dbPath)) {
                const data = fs.readFileSync(this.dbPath, 'utf-8');
                const db = JSON.parse(data) as UserDatabase;

                // Проверяем версию и обновляем если нужно
                if (db.version !== '1.0') {
                    db.version = '1.0';
                    this.saveDatabase();
                }

                // Миграция: если нет isAdmin, первый пользователь становится админом
                if (db.users.length > 0 && !('isAdmin' in db.users[0])) {
                    db.users[0].isAdmin = true;
                    for (let i = 1; i < db.users.length; i++) db.users[i].isAdmin = false;
                    this.saveDatabase();
                }

                return db;
            } else {
                // Создаём новую базу данных
                const initialDb: UserDatabase = {
                    users: [],
                    lastUpdated: new Date().toISOString(),
                    version: '1.0'
                };
                this.saveDatabase();
                return initialDb;
            }
        } catch (error) {
            console.error('Ошибка при загрузке базы данных пользователей:', error);
            return {
                users: [],
                lastUpdated: new Date().toISOString(),
                version: '1.0'
            };
        }
    }

    private saveDatabase(): void {
        try {
            this.database.lastUpdated = new Date().toISOString();
            fs.writeFileSync(this.dbPath, JSON.stringify(this.database, null, 2), 'utf-8');
        } catch (error) {
            console.error('Ошибка при сохранении базы данных пользователей:', error);
        }
    }

    /**
     * Проверяет, есть ли у пользователя доступ
     */
    public hasAccess(userId: string, username?: string): boolean {
        const user = this.database.users.find(u => {
            return u.isActive && (
                (!!u.id && u.id === userId) ||
                (username && !!u.username && u.username === username)
            );
        });
        return !!user;
    }

    /**
     * Проверяет, является ли пользователь администратором
     */
    public isAdmin(userId: string, username?: string): boolean {
        const user = this.database.users.find(u => {
            return u.isActive && (
                (!!u.id && u.id === userId) ||
                (username && !!u.username && u.username === username)
            );
        });
        return !!user && !!user.isAdmin;
    }

    /**
     * Добавляет нового пользователя
     */
    public addUser(userData: Omit<User, 'addedAt' | 'isActive' | 'isAdmin'>, addedBy: string, isAdmin = false): boolean {
        try {
            // Проверяем, не существует ли уже пользователь
            const existingUser = this.database.users.find(u => {
                return (!!u.id && !!userData.id && u.id === userData.id) ||
                       (userData.username && !!u.username && u.username === userData.username);
            });

            if (existingUser) {
                console.log(`Пользователь ${userData.username || userData.id} уже существует`);
                return false;
            }

            const newUser: User = {
                ...userData,
                addedAt: new Date().toISOString(),
                isActive: true,
                isAdmin
            };

            this.database.users.push(newUser);
            this.saveDatabase();

            console.log(`Пользователь ${userData.username || userData.id} добавлен`);
            return true;
        } catch (error) {
            console.error('Ошибка при добавлении пользователя:', error);
            return false;
        }
    }

    /**
     * Устанавливает пользователя в качестве администратора
     */
    public setAdmin(userId: string, username?: string, value: boolean = true): boolean {
        const user = this.database.users.find(u => {
            return (!!u.id && !!userId && u.id === userId) ||
                   (username && !!u.username && u.username === username);
        });
        if (!user) return false;
        user.isAdmin = value;
        this.saveDatabase();
        return true;
    }

    /**
     * Удаляет пользователя (деактивирует)
     */
    public removeUser(userId: string, username?: string): boolean {
        try {
            const userIndex = this.database.users.findIndex(u => {
                return (!!u.id && !!userId && u.id === userId) ||
                       (username && !!u.username && u.username === username);
            });

            if (userIndex === -1) {
                console.log(`Пользователь ${username || userId} не найден`);
                return false;
            }

            this.database.users[userIndex].isActive = false;
            this.saveDatabase();

            console.log(`Пользователь ${username || userId} деактивирован`);
            return true;
        } catch (error) {
            console.error('Ошибка при удалении пользователя:', error);
            return false;
        }
    }

    /**
     * Полностью удаляет пользователя из базы
     */
    public deleteUser(userId: string, username?: string): boolean {
        try {
            const userIndex = this.database.users.findIndex(u => {
                return (!!u.id && !!userId && u.id === userId) ||
                       (username && !!u.username && u.username === username);
            });

            if (userIndex === -1) {
                console.log(`Пользователь ${username || userId} не найден`);
                return false;
            }

            this.database.users.splice(userIndex, 1);
            this.saveDatabase();

            console.log(`Пользователь ${username || userId} полностью удалён`);
            return true;
        } catch (error) {
            console.error('Ошибка при удалении пользователя:', error);
            return false;
        }
    }

    /**
     * Активирует пользователя
     */
    public activateUser(userId: string, username?: string): boolean {
        try {
            const user = this.database.users.find(u => {
                return (!!u.id && !!userId && u.id === userId) ||
                       (username && !!u.username && u.username === username);
            });

            if (!user) {
                console.log(`Пользователь ${username || userId} не найден`);
                return false;
            }

            user.isActive = true;
            this.saveDatabase();

            console.log(`Пользователь ${username || userId} активирован`);
            return true;
        } catch (error) {
            console.error('Ошибка при активации пользователя:', error);
            return false;
        }
    }

    /**
     * Получает список всех пользователей
     */
    public getAllUsers(): User[] {
        return [...this.database.users];
    }

    /**
     * Получает список активных пользователей
     */
    public getActiveUsers(): User[] {
        return this.database.users.filter(u => u.isActive);
    }

    /**
     * Получает информацию о пользователе
     */
    public getUser(userId: string, username?: string): User | null {
        return this.database.users.find(u => {
            return (!!u.id && !!userId && u.id === userId) ||
                   (username && !!u.username && u.username === username);
        }) || null;
    }

    /**
     * Обновляет информацию о пользователе
     */
    public updateUser(userId: string, updates: Partial<User>): boolean {
        try {
            const user = this.database.users.find(u => !!u.id && !!userId && u.id === userId);
            if (!user) {
                return false;
            }

            Object.assign(user, updates);
            this.saveDatabase();
            return true;
        } catch (error) {
            console.error('Ошибка при обновлении пользователя:', error);
            return false;
        }
    }

    /**
     * Получает статистику базы данных
     */
    public getStats(): { total: number; active: number; inactive: number; lastUpdated: string } {
        const total = this.database.users.length;
        const active = this.database.users.filter(u => u.isActive).length;
        const inactive = total - active;

        return {
            total,
            active,
            inactive,
            lastUpdated: this.database.lastUpdated
        };
    }
}

// Создаём единственный экземпляр менеджера
export const userAccessManager = new UserAccessManager();
