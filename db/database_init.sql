/*
 * File Name   : database_init.sql
 * Author      : Michael LeDuc
 * Created Date: Thu Feb 06 2025
 *
 * Copyright (c) 2025 Zirtue, Inc.
 */

 -- SQL Creation Scripts that must be run BEFORE TypeORM can do anything
CREATE DATABASE IF NOT EXISTS zirtue_next_gen;

-- Create Schemas we are using
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS notifications;
CREATE SCHEMA IF NOT EXISTS payments;
