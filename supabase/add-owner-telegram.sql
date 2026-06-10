-- Миграция: добавить Telegram chat ID владельца к комнатам
-- Запустите в Supabase SQL Editor (dashboard.supabase.com → SQL Editor → New query)

alter table public.rooms
  add column if not exists owner_telegram_chat_id text;

-- После выполнения задайте chat ID для каждой комнаты:
-- update public.rooms set owner_telegram_chat_id = '123456789' where name = 'Радуга';
--
-- Чтобы узнать свой chat ID — напишите боту @userinfobot в Telegram.
