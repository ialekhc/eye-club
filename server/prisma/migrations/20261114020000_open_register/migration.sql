-- One cashier session per physical register, including concurrent opens.
CREATE UNIQUE INDEX "PosSession_one_open_per_register" ON "PosSession" ("registerId") WHERE "status" = 'OPEN';
