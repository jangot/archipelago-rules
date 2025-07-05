import { userAccessManager } from './user-access';

const command = process.argv[2];
const args = process.argv.slice(3);

function showHelp() {
    console.log(`
👥 Управление пользователями Архипелаг Rules Bot

📋 Команды:
  list                    - Показать всех пользователей
  stats                   - Показать статистику
  add <username>          - Добавить пользователя по username
  add-id <id>             - Добавить пользователя по ID
  remove <username>       - Деактивировать пользователя
  activate <username>     - Активировать пользователя
  delete <username>       - Полностью удалить пользователя
  help                    - Показать эту справку

💡 Примеры:
  npm run manage-users list
  npm run manage-users add jangot
  npm run manage-users add-id 123456789
  npm run manage-users remove someuser
  npm run manage-users stats
    `);
}

async function main() {
    switch (command) {
        case 'list':
            const users = userAccessManager.getAllUsers();
            if (users.length === 0) {
                console.log('📭 Нет пользователей в базе данных');
            } else {
                console.log('👥 Список всех пользователей:');
                users.forEach((user, index) => {
                    const status = user.isActive ? '✅' : '❌';
                    const type = user.id ? 'ID' : 'Username';
                    const identifier = user.id || user.username || 'Неизвестно';
                    console.log(`${index + 1}. ${status} ${type}: ${identifier} (добавлен: ${new Date(user.addedAt).toLocaleDateString()})`);
                });
            }
            break;

        case 'stats':
            const stats = userAccessManager.getStats();
            console.log('📊 Статистика пользователей:');
            console.log(`   Всего пользователей: ${stats.total}`);
            console.log(`   Активных: ${stats.active}`);
            console.log(`   Неактивных: ${stats.inactive}`);
            console.log(`   Последнее обновление: ${new Date(stats.lastUpdated).toLocaleString()}`);
            break;

        case 'add':
            if (!args[0]) {
                console.log('❌ Укажите username: npm run manage-users add <username>');
                return;
            }
            const success = userAccessManager.addUser({
                id: '',
                username: args[0],
                addedBy: 'cli'
            }, 'cli');
            if (success) {
                console.log(`✅ Пользователь ${args[0]} добавлен!`);
            } else {
                console.log(`❌ Пользователь ${args[0]} уже существует или произошла ошибка`);
            }
            break;

        case 'add-id':
            if (!args[0]) {
                console.log('❌ Укажите ID: npm run manage-users add-id <id>');
                return;
            }
            const successId = userAccessManager.addUser({
                id: args[0],
                addedBy: 'cli'
            }, 'cli');
            if (successId) {
                console.log(`✅ Пользователь с ID ${args[0]} добавлен!`);
            } else {
                console.log(`❌ Пользователь с ID ${args[0]} уже существует или произошла ошибка`);
            }
            break;

        case 'remove':
            if (!args[0]) {
                console.log('❌ Укажите username: npm run manage-users remove <username>');
                return;
            }
            const removed = userAccessManager.removeUser('', args[0]);
            if (removed) {
                console.log(`✅ Пользователь ${args[0]} деактивирован!`);
            } else {
                console.log(`❌ Пользователь ${args[0]} не найден`);
            }
            break;

        case 'activate':
            if (!args[0]) {
                console.log('❌ Укажите username: npm run manage-users activate <username>');
                return;
            }
            const activated = userAccessManager.activateUser('', args[0]);
            if (activated) {
                console.log(`✅ Пользователь ${args[0]} активирован!`);
            } else {
                console.log(`❌ Пользователь ${args[0]} не найден`);
            }
            break;

        case 'delete':
            if (!args[0]) {
                console.log('❌ Укажите username: npm run manage-users delete <username>');
                return;
            }
            const deleted = userAccessManager.deleteUser('', args[0]);
            if (deleted) {
                console.log(`✅ Пользователь ${args[0]} полностью удалён!`);
            } else {
                console.log(`❌ Пользователь ${args[0]} не найден`);
            }
            break;

        case 'help':
        default:
            showHelp();
            break;
    }
}

main().catch((error) => {
    console.error('❌ Ошибка:', error);
    process.exit(1);
});