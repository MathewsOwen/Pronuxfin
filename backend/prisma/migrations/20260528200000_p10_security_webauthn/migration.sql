-- P10: security audit log, WebAuthn credentials/challenges

CREATE TABLE "SecurityEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SecurityEvent_userId_createdAt_idx" ON "SecurityEvent"("userId", "createdAt");
CREATE INDEX "SecurityEvent_eventType_createdAt_idx" ON "SecurityEvent"("eventType", "createdAt");
CREATE INDEX "SecurityEvent_createdAt_idx" ON "SecurityEvent"("createdAt");

ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "WebAuthnCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" BYTEA NOT NULL,
    "counter" BIGINT NOT NULL DEFAULT 0,
    "deviceType" TEXT,
    "backedUp" BOOLEAN NOT NULL DEFAULT false,
    "transports" TEXT,
    "friendlyName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "WebAuthnCredential_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WebAuthnCredential_credentialId_key" ON "WebAuthnCredential"("credentialId");
CREATE INDEX "WebAuthnCredential_userId_idx" ON "WebAuthnCredential"("userId");

ALTER TABLE "WebAuthnCredential" ADD CONSTRAINT "WebAuthnCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "WebAuthnChallenge" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "challenge" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebAuthnChallenge_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WebAuthnChallenge_userId_type_idx" ON "WebAuthnChallenge"("userId", "type");
CREATE INDEX "WebAuthnChallenge_expiresAt_idx" ON "WebAuthnChallenge"("expiresAt");

ALTER TABLE "WebAuthnChallenge" ADD CONSTRAINT "WebAuthnChallenge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
