import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    username?: string;
    first_name: string;
  };
  chat: {
    id: number;
  };
  text?: string;
  photo?: Array<{ file_id: string }>;
  location?: {
    latitude: number;
    longitude: number;
    live_period?: number;
  };
}

interface TelegramUpdate {
  message?: TelegramMessage;
  callback_query?: {
    id: string;
    from: { id: number };
    message: { chat: { id: number }; message_id: number };
    data: string;
  };
}

async function sendMessage(chatId: number, text: string, options: any = {}) {
  const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
      ...options,
    }),
  });
  return await response.json();
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

async function getUserByTelegramId(telegramId: number) {
  const { data } = await supabase
    .from('telegram_users')
    .select('user_id')
    .eq('telegram_id', telegramId)
    .single();
  return data;
}

async function getEmployeeByUserId(userId: string) {
  const { data } = await supabase
    .from('employees')
    .select('*')
    .eq('user_id', userId)
    .single();
  return data;
}

async function getUserTasks(userId: string, status?: string) {
  let query = supabase
    .from('tasks')
    .select('*')
    .eq('assigned_employee_id', userId)
    .order('scheduled_time', { ascending: true });

  if (status) {
    query = query.eq('status', status);
  }

  const { data } = await query;
  return data || [];
}

function translateWorkType(workType: string): string {
  const translations: Record<string, string> = {
    'installation': 'Установка',
    'repair': 'Ремонт',
    'maintenance': 'Обслуживание',
    'inspection': 'Осмотр',
    'consultation': 'Консультация',
    'mounting': 'Монтаж',
    'dismantling': 'Демонтаж',
    'diagnostics': 'Диагностика',
  };
  return translations[workType] || workType;
}

function formatTaskCard(task: any): string {
  const statusEmoji: Record<string, string> = {
    pending: '🔵',
    assigned: '🟡',
    en_route: '🚗',
    in_progress: '🔧',
    completed: '✅',
    cancelled: '❌',
  };

  const priorityEmoji: Record<string, string> = {
    low: '🟢',
    medium: '🟡',
    high: '🔴',
  };

  const scheduledTime = new Date(task.scheduled_time).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
${statusEmoji[task.status] || '⚪'} <b>Заявка №${task.order_number}</b>

🔧 ${translateWorkType(task.work_type)}
${priorityEmoji[task.priority]} Приоритет: ${task.priority === 'high' ? 'Высокий' : task.priority === 'medium' ? 'Средний' : 'Низкий'}
📍 ${task.address}
🕐 ${scheduledTime}
${task.customer_name ? `👤 ${task.customer_name}` : ''}
${task.customer_phone ? `📞 <a href="tel:${task.customer_phone}">${task.customer_phone}</a>` : ''}
${task.description ? `📝 ${task.description}` : ''}

<b>Статус:</b> ${getStatusText(task.status)}
  `.trim();
}

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: 'Ожидает',
    assigned: 'Назначена',
    en_route: 'В пути',
    in_progress: 'Выполняется',
    completed: 'Завершена',
    cancelled: 'Отменена',
  };
  return statusMap[status] || status;
}

function getTaskKeyboard(task: any) {
  const buttons = [];

  if (task.status === 'assigned') {
    buttons.push([{ text: '🚗 В пути', callback_data: `enroute_${task.id}` }]);
  }

  if (task.status === 'en_route') {
    buttons.push([{ text: '🔧 Начать работу', callback_data: `start_${task.id}` }]);
  }

  if (task.status === 'in_progress') {
    buttons.push([{ text: '✅ Завершить', callback_data: `complete_${task.id}` }]);
  }

  if (['assigned', 'en_route', 'in_progress'].includes(task.status)) {
    buttons.push([
      { text: '📷 Фото', callback_data: `photo_${task.id}` },
      { text: '💬 Комментарий', callback_data: `comment_${task.id}` },
    ]);
  }

  return { inline_keyboard: buttons };
}

async function handleCommand(message: TelegramMessage) {
  const chatId = message.chat.id;
  const text = message.text || '';
  const telegramId = message.from.id;

  if (text.startsWith('/start')) {
    await sendMessage(chatId, `
👋 Добро пожаловать в систему управления задачами!

Для начала работы свяжите свой Telegram аккаунт:
1. Откройте веб-интерфейс
2. Получите код привязки
3. Отправьте команду: /auth КОД

<b>Доступные команды:</b>
/tasks - Мои задачи
/active - Активные задачи
/completed - Завершенные задачи
/status - Изменить статус
/help - Справка
    `, {
      reply_markup: {
        keyboard: [
          [{ text: '📋 Мои задачи' }, { text: '🟡 Активные задачи' }],
          [{ text: '✅ Завершенные задачи' }, { text: '📊 Мой статус' }],
        ],
        resize_keyboard: true,
        persistent: true,
      },
    });
    return;
  }

  if (text.startsWith('/auth')) {
    const code = text.split(' ')[1];
    if (!code) {
      await sendMessage(chatId, '❌ Укажите код: /auth КОД');
      return;
    }

    const { data: authCode } = await supabase
      .from('telegram_auth_codes')
      .select('user_id, used, expires_at')
      .eq('code', code)
      .single();

    if (!authCode) {
      await sendMessage(chatId, '❌ Неверный код');
      return;
    }

    if (authCode.used) {
      await sendMessage(chatId, '❌ Код уже использован');
      return;
    }

    if (new Date(authCode.expires_at) < new Date()) {
      await sendMessage(chatId, '❌ Код истек');
      return;
    }

    // Link account
    await supabase.from('telegram_users').insert({
      user_id: authCode.user_id,
      telegram_id: telegramId,
      telegram_username: message.from.username,
    });

    await supabase
      .from('telegram_auth_codes')
      .update({ used: true })
      .eq('code', code);

    await sendMessage(chatId, '✅ Аккаунт успешно привязан! Используйте /tasks для просмотра задач');
    return;
  }

  // Check if user is linked
  const user = await getUserByTelegramId(telegramId);
  if (!user) {
    await sendMessage(chatId, '❌ Сначала свяжите аккаунт командой /auth КОД');
    return;
  }

  const employee = await getEmployeeByUserId(user.user_id);
  if (!employee) {
    await sendMessage(chatId, '❌ Профиль сотрудника не найден');
    return;
  }

  if (text.startsWith('/tasks') || text === '📋 Мои задачи') {
    const tasks = await getUserTasks(employee.id);
    if (tasks.length === 0) {
      await sendMessage(chatId, '📋 Нет активных задач', {
        reply_markup: {
          keyboard: [
            [{ text: '📋 Мои задачи' }, { text: '🟡 Активные задачи' }],
            [{ text: '✅ Завершенные задачи' }, { text: '📊 Мой статус' }],
          ],
          resize_keyboard: true,
          persistent: true,
        },
      });
      return;
    }

    await sendMessage(chatId, '<b>Ваши задачи:</b>', {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🟡 Активные', callback_data: 'filter_active' },
            { text: '✅ Завершенные', callback_data: 'filter_completed' },
            { text: '📋 Все', callback_data: 'filter_all' },
          ],
        ],
      },
    });

    for (const task of tasks.slice(0, 5)) {
      await sendMessage(chatId, formatTaskCard(task), {
        reply_markup: getTaskKeyboard(task),
      });
    }
    return;
  }

  if (text.startsWith('/active') || text === '🟡 Активные задачи') {
    const tasks = await getUserTasks(employee.id);
    const activeTasks = tasks.filter(t => ['assigned', 'en_route', 'in_progress'].includes(t.status));

    if (activeTasks.length === 0) {
      await sendMessage(chatId, '📋 Нет активных задач', {
        reply_markup: {
          keyboard: [
            [{ text: '📋 Мои задачи' }, { text: '🟡 Активные задачи' }],
            [{ text: '✅ Завершенные задачи' }, { text: '📊 Мой статус' }],
          ],
          resize_keyboard: true,
          persistent: true,
        },
      });
      return;
    }

    for (const task of activeTasks) {
      await sendMessage(chatId, formatTaskCard(task), {
        reply_markup: getTaskKeyboard(task),
      });
    }
    return;
  }

  if (text.startsWith('/completed') || text === '✅ Завершенные задачи') {
    const tasks = await getUserTasks(employee.id, 'completed');
    if (tasks.length === 0) {
      await sendMessage(chatId, '📋 Нет завершенных задач', {
        reply_markup: {
          keyboard: [
            [{ text: '📋 Мои задачи' }, { text: '🟡 Активные задачи' }],
            [{ text: '✅ Завершенные задачи' }, { text: '📊 Мой статус' }],
          ],
          resize_keyboard: true,
          persistent: true,
        },
      });
      return;
    }

    for (const task of tasks.slice(0, 5)) {
      await sendMessage(chatId, formatTaskCard(task));
    }
    return;
  }

  if (text.startsWith('/status') || text === '📊 Мой статус') {
    await sendMessage(chatId, `Ваш текущий статус: ${employee.status}`, {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🟢 Доступен', callback_data: 'employee_status_available' }],
          [{ text: '🟡 Занят', callback_data: 'employee_status_busy' }],
          [{ text: '⚫ Оффлайн', callback_data: 'employee_status_offline' }],
        ],
      },
    });
    return;
  }

  if (text.startsWith('/help')) {
    await sendMessage(chatId, `
<b>Доступные команды:</b>

/tasks - Показать мои задачи
/active - Активные задачи
/completed - Завершенные задачи
/status - Изменить статус
/help - Справка

<b>Работа с задачами:</b>
• Нажмите "В пути" когда едете к клиенту
• Нажмите "Начать работу" когда приступили
• Нажмите "Завершить" когда закончили
• Используйте кнопки "Фото" и "Комментарий" для добавления информации
    `);
    return;
  }
}

async function handleCallbackQuery(callbackQuery: any) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;
  const telegramId = callbackQuery.from.id;

  await answerCallbackQuery(callbackQuery.id);

  const user = await getUserByTelegramId(telegramId);
  if (!user) return;

  const employee = await getEmployeeByUserId(user.user_id);
  if (!employee) return;

  // Handle task status updates
  if (data.startsWith('enroute_')) {
    const taskId = data.replace('enroute_', '');
    
    // Set state to wait for location
    await supabase.from('telegram_bot_state').upsert({
      telegram_id: telegramId,
      state: { 
        waiting_for: 'enroute_location', 
        task_id: taskId 
      },
      updated_at: new Date().toISOString(),
    });

    await supabase
      .from('tasks')
      .update({
        status: 'en_route',
        en_route_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    await sendMessage(chatId, 
      '✅ Статус обновлен: В пути\n\n' +
      '📍 Пожалуйста, подтвердите вашу геолокацию.\n\n' +
      'Нажмите кнопку ниже и отправьте вашу текущую геолокацию.',
      {
        reply_markup: {
          keyboard: [
            [{ text: '📍 Подтвердить местоположение', request_location: true }],
            [{ text: '📋 Мои задачи' }, { text: '🟡 Активные задачи' }]
          ],
          resize_keyboard: true,
          one_time_keyboard: false,
        },
      }
    );
    return;
  }

  if (data.startsWith('start_')) {
    const taskId = data.replace('start_', '');
    
    // Require geolocation before starting work
    await supabase.from('telegram_bot_state').upsert({
      telegram_id: telegramId,
      state: { 
        waiting_for: 'start_location', 
        task_id: taskId 
      },
      updated_at: new Date().toISOString(),
    });

    await sendMessage(chatId, 
      '📍 Для начала работы необходимо подтвердить вашу геолокацию.\n\n' +
      'Нажмите кнопку ниже и отправьте вашу текущую геолокацию.',
      {
        reply_markup: {
          keyboard: [
            [{ text: '📍 Подтвердить местоположение', request_location: true }],
            [{ text: '📋 Мои задачи' }, { text: '🟡 Активные задачи' }]
          ],
          resize_keyboard: true,
          one_time_keyboard: false,
        },
      }
    );
    return;
  }

  if (data.startsWith('complete_')) {
    const taskId = data.replace('complete_', '');
    
    // Require geolocation before completing work
    await supabase.from('telegram_bot_state').upsert({
      telegram_id: telegramId,
      state: { 
        waiting_for: 'completion_location', 
        task_id: taskId 
      },
      updated_at: new Date().toISOString(),
    });

    await sendMessage(chatId, 
      '📍 Для завершения работы необходимо подтвердить вашу геолокацию.\n\n' +
      'Нажмите кнопку ниже и отправьте вашу текущую геолокацию с места выполнения работ.',
      {
        reply_markup: {
          keyboard: [
            [{ text: '📍 Подтвердить завершение', request_location: true }],
            [{ text: '📋 Мои задачи' }, { text: '🟡 Активные задачи' }]
          ],
          resize_keyboard: true,
          one_time_keyboard: false,
        },
      }
    );
    return;
  }

  // Handle photo/comment requests
  if (data.startsWith('photo_')) {
    const taskId = data.replace('photo_', '');
    await supabase.from('telegram_bot_state').upsert({
      telegram_id: telegramId,
      state: { waiting_for: 'photo', task_id: taskId },
      updated_at: new Date().toISOString(),
    });

    await sendMessage(chatId, '📷 Отправьте фото');
    return;
  }

  if (data.startsWith('comment_')) {
    const taskId = data.replace('comment_', '');
    await supabase.from('telegram_bot_state').upsert({
      telegram_id: telegramId,
      state: { waiting_for: 'comment', task_id: taskId },
      updated_at: new Date().toISOString(),
    });

    await sendMessage(chatId, '💬 Напишите комментарий');
    return;
  }

  // Handle employee status change
  if (data.startsWith('employee_status_')) {
    const status = data.replace('employee_status_', '');
    await supabase
      .from('employees')
      .update({ status })
      .eq('id', employee.id);

    await sendMessage(chatId, `✅ Статус изменен: ${status}`);
    return;
  }

  // Handle task filters
  if (data.startsWith('filter_')) {
    const filter = data.replace('filter_', '');
    let tasks;

    if (filter === 'active') {
      tasks = await getUserTasks(employee.id);
      tasks = tasks.filter(t => ['assigned', 'en_route', 'in_progress'].includes(t.status));
    } else if (filter === 'completed') {
      tasks = await getUserTasks(employee.id, 'completed');
    } else {
      tasks = await getUserTasks(employee.id);
    }

    if (tasks.length === 0) {
      await sendMessage(chatId, '📋 Нет задач в этой категории');
      return;
    }

    for (const task of tasks.slice(0, 5)) {
      await sendMessage(chatId, formatTaskCard(task), {
        reply_markup: getTaskKeyboard(task),
      });
    }
  }
}

async function handleMessage(message: TelegramMessage) {
  const chatId = message.chat.id;
  const telegramId = message.from.id;

  const { data: state } = await supabase
    .from('telegram_bot_state')
    .select('state')
    .eq('telegram_id', telegramId)
    .single();

  if (!state?.state) return;

  const botState = state.state as any;

  // Handle location
  if (message.location) {
    const user = await getUserByTelegramId(telegramId);
    if (!user) return;

    const employee = await getEmployeeByUserId(user.user_id);
    if (!employee) {
      await sendMessage(chatId, '❌ Вы не зарегистрированы как сотрудник');
      return;
    }

  // Handle geolocation for en route
    if (botState?.waiting_for === 'enroute_location') {
      const taskId = botState.task_id;
      
      console.log('En route - location:', message.location);
      
      const { data: empUpdate, error: empError } = await supabase
        .from('employees')
        .update({
          current_location: `(${message.location.latitude},${message.location.longitude})`,
          location_updated_at: new Date().toISOString(),
        })
        .eq('id', employee.id)
        .select();

      console.log('Employee location update (enroute):', { empUpdate, empError });

      await supabase
        .from('telegram_bot_state')
        .delete()
        .eq('telegram_id', telegramId);

      await sendMessage(chatId, 
        '✅ Геолокация подтверждена!\n\n' +
        '🚗 Статус: В пути\n\n' +
        'Для автоматического отслеживания можете включить Live Location (живую геолокацию).',
        {
          reply_markup: {
            keyboard: [
              [{ text: '📍 Включить отслеживание', request_location: true }],
              [{ text: '📋 Мои задачи' }, { text: '🟡 Активные задачи' }]
            ],
            resize_keyboard: true,
          },
        }
      );
      return;
    }

  // Handle geolocation for starting work
    if (botState?.waiting_for === 'start_location') {
      const taskId = botState.task_id;
      
      console.log('Starting work - location:', message.location);
      
      const { data: taskUpdate, error: taskError } = await supabase
        .from('tasks')
        .update({
          status: 'in_progress',
          started_at: new Date().toISOString(),
          start_location: `(${message.location.latitude},${message.location.longitude})`,
        })
        .eq('id', taskId)
        .select();

      console.log('Task update result:', { taskUpdate, taskError });

      const { data: empUpdate, error: empError } = await supabase
        .from('employees')
        .update({
          current_location: `(${message.location.latitude},${message.location.longitude})`,
          location_updated_at: new Date().toISOString(),
        })
        .eq('id', employee.id)
        .select();

      console.log('Employee location update result:', { empUpdate, empError });

      await supabase
        .from('telegram_bot_state')
        .delete()
        .eq('telegram_id', telegramId);

      await sendMessage(chatId, 
        '✅ Геолокация подтверждена!\n\n' +
        '🚀 Статус обновлен: Выполняется\n\n' +
        'Для автоматического отслеживания можете включить Live Location (живую геолокацию).',
        {
          reply_markup: {
            keyboard: [
              [{ text: '📍 Включить отслеживание', request_location: true }],
              [{ text: '📋 Мои задачи' }, { text: '🟡 Активные задачи' }]
            ],
            resize_keyboard: true,
          },
        }
      );
      return;
    }

  // Handle geolocation for completing work
    if (botState?.waiting_for === 'completion_location') {
      const taskId = botState.task_id;
      
      console.log('Completing work - location:', message.location);
      
      const { data: taskComplete, error: completeError } = await supabase
        .from('tasks')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completion_location: `(${message.location.latitude},${message.location.longitude})`,
        })
        .eq('id', taskId)
        .select();

      console.log('Task completion result:', { taskComplete, completeError });

      const { data: empUpdate, error: empError } = await supabase
        .from('employees')
        .update({
          current_location: `(${message.location.latitude},${message.location.longitude})`,
          location_updated_at: new Date().toISOString(),
        })
        .eq('id', employee.id)
        .select();

      console.log('Employee location update result:', { empUpdate, empError });

      await supabase
        .from('telegram_bot_state')
        .delete()
        .eq('telegram_id', telegramId);

      await sendMessage(chatId, 
        '✅ Работа завершена!\n\n' +
        '📍 Геолокация завершения сохранена\n' +
        '⏱️ Время работы будет рассчитано автоматически\n\n' +
        'Спасибо за работу! 👍',
        {
          reply_markup: {
            keyboard: [
              [{ text: '📋 Мои задачи' }, { text: '🟡 Активные задачи' }],
              [{ text: '✅ Завершенные задачи' }, { text: '📊 Мой статус' }]
            ],
            resize_keyboard: true,
            persistent: true,
          },
        }
      );
      return;
    }

    // Handle regular geolocation (Live Location and manual sharing)
    await supabase
      .from('employees')
      .update({
        current_location: `(${message.location.latitude},${message.location.longitude})`,
        location_updated_at: new Date().toISOString(),
      })
      .eq('id', employee.id);

    if (message.location.live_period) {
      await sendMessage(chatId, 
        `✅ Отслеживание активировано!\n\n` +
        `📍 Ваша геолокация будет обновляться автоматически в течение ${Math.floor(message.location.live_period / 60)} минут.`
      );
    } else if (botState?.waiting_for === 'location') {
      // Clear old location state
      await supabase
        .from('telegram_bot_state')
        .delete()
        .eq('telegram_id', telegramId);
      
      await sendMessage(chatId, '📍 Геолокация обновлена');
    }

    return;
  }

  // Handle photo
  if (message.photo && botState.waiting_for === 'photo') {
    const user = await getUserByTelegramId(telegramId);
    if (!user) return;

    console.log('Photo upload started for task:', botState.task_id);

    const fileId = message.photo[message.photo.length - 1].file_id;

    // Get file info
    const fileResponse = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
    const fileData = await fileResponse.json();
    const filePath = fileData.result.file_path;

    console.log('File info retrieved:', filePath);

    // Download file
    const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;
    const imageResponse = await fetch(fileUrl);
    const imageBlob = await imageResponse.arrayBuffer();

    console.log('File downloaded, size:', imageBlob.byteLength);

    // Upload to Supabase Storage
    const fileName = `${botState.task_id}/${Date.now()}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('task-photos')
      .upload(fileName, imageBlob, {
        contentType: 'image/jpeg',
      });

    console.log('Storage upload result:', { uploadData, uploadError });

    if (uploadData) {
      const { data: urlData } = supabase.storage
        .from('task-photos')
        .getPublicUrl(fileName);

      console.log('Public URL generated:', urlData.publicUrl);

      const { data: photoData, error: photoError } = await supabase.from('task_photos').insert({
        task_id: botState.task_id,
        uploaded_by: user.user_id,
        photo_url: urlData.publicUrl,
      }).select();

      console.log('Photo DB insert result:', { photoData, photoError });

      await supabase
        .from('telegram_bot_state')
        .delete()
        .eq('telegram_id', telegramId);

      await sendMessage(chatId, '✅ Фото загружено');
    } else {
      console.error('Photo upload failed:', uploadError);
      await sendMessage(chatId, '❌ Ошибка загрузки фото');
    }
    return;
  }

  // Handle comment
  if (message.text && botState.waiting_for === 'comment') {
    const user = await getUserByTelegramId(telegramId);
    if (!user) return;

    console.log('Adding comment for task:', botState.task_id, 'by user:', user.user_id);

    const { data: commentData, error: commentError } = await supabase.from('task_comments').insert({
      task_id: botState.task_id,
      user_id: user.user_id,
      comment: message.text,
    }).select();

    console.log('Comment insert result:', { commentData, commentError });

    await supabase
      .from('telegram_bot_state')
      .delete()
      .eq('telegram_id', telegramId);

    if (commentError) {
      await sendMessage(chatId, '❌ Ошибка добавления комментария');
    } else {
      await sendMessage(chatId, '✅ Комментарий добавлен');
    }
    return;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Verify Telegram secret token
  const secretToken = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
  const expectedToken = Deno.env.get('TELEGRAM_SECRET_TOKEN');

  if (!secretToken || secretToken !== expectedToken) {
    console.error('Invalid or missing secret token');
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const update: TelegramUpdate = await req.json();
    console.log('Received update:', JSON.stringify(update));

    if (update.message) {
      const text = update.message.text || '';
      const isCommand = text.startsWith('/');
      const isReplyKeyboard = [
        '📋 Мои задачи',
        '🟡 Активные задачи',
        '✅ Завершенные задачи',
        '📊 Мой статус'
      ].includes(text);

      if (isCommand || isReplyKeyboard) {
        await handleCommand(update.message);
      } else {
        await handleMessage(update.message);
      }
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in telegram-webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
