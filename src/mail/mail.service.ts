import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_PORT === '465',
        auth: { user, pass },
      });
    } else {
      this.logger.warn('SMTP not configured — emails will be skipped. Set SMTP_HOST, SMTP_USER, SMTP_PASS.');
    }
  }

  async send(opts: { to: string; subject: string; text: string; html?: string }): Promise<void> {
    if (!this.transporter) return;

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM ?? 'WATether <noreply@watheter.com>',
        to: opts.to,
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
      });
    } catch (err) {
      this.logger.error(`Failed to send email to ${opts.to}: ${err}`);
    }
  }
}
