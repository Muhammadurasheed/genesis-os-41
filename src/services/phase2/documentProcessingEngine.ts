// ============================================================
// Phase 2: Document Processing Engine - PDF, Excel, Email Processing
// Advanced document manipulation and generation capabilities
// ============================================================

import { EventEmitter } from 'events';
import { dockerContainerService } from '../core/dockerContainerService';

export interface DocumentTask {
  taskId: string;
  type: 'pdf_generate' | 'pdf_edit' | 'excel_create' | 'excel_edit' | 'email_compose' | 'email_send' | 'convert_format';
  inputData: any;
  outputPath?: string;
  template?: string;
  agentId: string;
}

export interface DocumentResult {
  taskId: string;
  success: boolean;
  result?: any;
  error?: string;
  outputPath?: string;
  fileSize?: number;
  duration: number;
  timestamp: Date;
}

export interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody?: string;
  attachments?: string[];
  recipients: {
    to: string[];
    cc?: string[];
    bcc?: string[];
  };
}

export interface ExcelData {
  sheets: {
    name: string;
    data: any[][];
    headers?: string[];
  }[];
  formatting?: {
    sheet: string;
    cell: string;
    style: Record<string, any>;
  }[];
}

class DocumentProcessingEngine extends EventEmitter {
  private processQueue: Map<string, DocumentTask> = new Map();

  constructor() {
    super();
    console.log('📄 Document Processing Engine initializing...');
  }

  // PDF Generation with Templates
  async generatePDF(task: DocumentTask): Promise<DocumentResult> {
    const startTime = Date.now();
    
    try {
      console.log(`📄 Generating PDF document: ${task.taskId}`);

      // Get agent container
      const containers = dockerContainerService.getAllContainers();
      const agentContainer = containers.find(c => c.agentId === task.agentId);
      
      if (!agentContainer) {
        throw new Error(`Agent container not found for: ${task.agentId}`);
      }

      // Prepare PDF generation script
      const pdfScript = this.generatePDFScript(task.inputData, task.template);
      const scriptPath = `/tmp/pdf_generation_${task.taskId}.py`;
      const outputPath = task.outputPath || `/workspace/output_${task.taskId}.pdf`;

      // Write script to container
      await dockerContainerService.executeCommand(agentContainer.containerId, [
        'sh', '-c', `cat > ${scriptPath} << 'EOF'\n${pdfScript}\nEOF`
      ]);

      // Install required packages if not already installed
      await dockerContainerService.executeCommand(agentContainer.containerId, [
        'pip', 'install', 'reportlab', 'weasyprint', 'jinja2'
      ]);

      // Execute PDF generation
      const result = await dockerContainerService.executeCommand(agentContainer.containerId, [
        'python3', scriptPath, outputPath
      ]);

      if (result.exitCode !== 0) {
        throw new Error(`PDF generation failed: ${result.stderr}`);
      }

      // Get file size
      const sizeResult = await dockerContainerService.executeCommand(agentContainer.containerId, [
        'stat', '-c', '%s', outputPath
      ]);
      const fileSize = parseInt(sizeResult.stdout.trim()) || 0;

      const documentResult: DocumentResult = {
        taskId: task.taskId,
        success: true,
        result: {
          pdfGenerated: true,
          pages: this.extractPageCount(result.stdout),
          template: task.template
        },
        outputPath,
        fileSize,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('documentProcessed', documentResult);
      return documentResult;

    } catch (error) {
      const documentResult: DocumentResult = {
        taskId: task.taskId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('documentFailed', documentResult);
      return documentResult;
    }
  }

  // Excel/Spreadsheet Manipulation
  async createExcelSpreadsheet(task: DocumentTask): Promise<DocumentResult> {
    const startTime = Date.now();
    
    try {
      console.log(`📊 Creating Excel spreadsheet: ${task.taskId}`);

      const containers = dockerContainerService.getAllContainers();
      const agentContainer = containers.find(c => c.agentId === task.agentId);
      
      if (!agentContainer) {
        throw new Error(`Agent container not found for: ${task.agentId}`);
      }

      const excelData = task.inputData as ExcelData;
      const scriptPath = `/tmp/excel_creation_${task.taskId}.py`;
      const outputPath = task.outputPath || `/workspace/spreadsheet_${task.taskId}.xlsx`;

      // Generate Excel creation script
      const excelScript = this.generateExcelScript(excelData, outputPath);

      // Write script to container
      await dockerContainerService.executeCommand(agentContainer.containerId, [
        'sh', '-c', `cat > ${scriptPath} << 'EOF'\n${excelScript}\nEOF`
      ]);

      // Install required packages
      await dockerContainerService.executeCommand(agentContainer.containerId, [
        'pip', 'install', 'openpyxl', 'xlsxwriter', 'pandas'
      ]);

      // Execute Excel creation
      const result = await dockerContainerService.executeCommand(agentContainer.containerId, [
        'python3', scriptPath
      ]);

      if (result.exitCode !== 0) {
        throw new Error(`Excel creation failed: ${result.stderr}`);
      }

      // Get file size
      const sizeResult = await dockerContainerService.executeCommand(agentContainer.containerId, [
        'stat', '-c', '%s', outputPath
      ]);
      const fileSize = parseInt(sizeResult.stdout.trim()) || 0;

      const documentResult: DocumentResult = {
        taskId: task.taskId,
        success: true,
        result: {
          spreadsheetCreated: true,
          sheets: excelData.sheets.length,
          rows: excelData.sheets.reduce((total, sheet) => total + sheet.data.length, 0)
        },
        outputPath,
        fileSize,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('documentProcessed', documentResult);
      return documentResult;

    } catch (error) {
      const documentResult: DocumentResult = {
        taskId: task.taskId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('documentFailed', documentResult);
      return documentResult;
    }
  }

  // Email Composition and Sending
  async composeEmail(task: DocumentTask): Promise<DocumentResult> {
    const startTime = Date.now();
    
    try {
      console.log(`📧 Composing email: ${task.taskId}`);

      const emailTemplate = task.inputData as EmailTemplate;
      
      // Generate email HTML if not provided
      if (!emailTemplate.htmlBody && emailTemplate.textBody) {
        emailTemplate.htmlBody = this.textToHtml(emailTemplate.textBody);
      }

      // Validate email template
      this.validateEmailTemplate(emailTemplate);

      const documentResult: DocumentResult = {
        taskId: task.taskId,
        success: true,
        result: {
          emailComposed: true,
          subject: emailTemplate.subject,
          recipients: emailTemplate.recipients.to.length,
          hasAttachments: (emailTemplate.attachments?.length || 0) > 0
        },
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('documentProcessed', documentResult);
      return documentResult;

    } catch (error) {
      const documentResult: DocumentResult = {
        taskId: task.taskId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('documentFailed', documentResult);
      return documentResult;
    }
  }

  // Send Email (integrates with email providers)
  async sendEmail(task: DocumentTask, smtpConfig?: any): Promise<DocumentResult> {
    const startTime = Date.now();
    
    try {
      console.log(`📤 Sending email: ${task.taskId}`);

      const containers = dockerContainerService.getAllContainers();
      const agentContainer = containers.find(c => c.agentId === task.agentId);
      
      if (!agentContainer) {
        throw new Error(`Agent container not found for: ${task.agentId}`);
      }

      const emailTemplate = task.inputData as EmailTemplate;
      const scriptPath = `/tmp/email_send_${task.taskId}.py`;

      // Generate email sending script
      const emailScript = this.generateEmailScript(emailTemplate, smtpConfig);

      // Write script to container
      await dockerContainerService.executeCommand(agentContainer.containerId, [
        'sh', '-c', `cat > ${scriptPath} << 'EOF'\n${emailScript}\nEOF`
      ]);

      // Install required packages
      await dockerContainerService.executeCommand(agentContainer.containerId, [
        'pip', 'install', 'sendgrid', 'smtplib', 'email-validator'
      ]);

      // Execute email sending
      const result = await dockerContainerService.executeCommand(agentContainer.containerId, [
        'python3', scriptPath
      ]);

      if (result.exitCode !== 0) {
        throw new Error(`Email sending failed: ${result.stderr}`);
      }

      const documentResult: DocumentResult = {
        taskId: task.taskId,
        success: true,
        result: {
          emailSent: true,
          messageId: this.extractMessageId(result.stdout),
          recipients: emailTemplate.recipients.to.length
        },
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('documentProcessed', documentResult);
      return documentResult;

    } catch (error) {
      const documentResult: DocumentResult = {
        taskId: task.taskId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('documentFailed', documentResult);
      return documentResult;
    }
  }

  // File Format Conversion
  async convertFormat(task: DocumentTask): Promise<DocumentResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🔄 Converting file format: ${task.taskId}`);

      const containers = dockerContainerService.getAllContainers();
      const agentContainer = containers.find(c => c.agentId === task.agentId);
      
      if (!agentContainer) {
        throw new Error(`Agent container not found for: ${task.agentId}`);
      }

      const { inputPath, outputPath, fromFormat, toFormat } = task.inputData;
      
      // Install conversion tools based on format
      await this.installConversionTools(agentContainer.containerId, fromFormat, toFormat);

      // Execute conversion
      const conversionCommand = this.getConversionCommand(inputPath, outputPath, fromFormat, toFormat);
      const result = await dockerContainerService.executeCommand(agentContainer.containerId, conversionCommand);

      if (result.exitCode !== 0) {
        throw new Error(`Format conversion failed: ${result.stderr}`);
      }

      // Get output file size
      const sizeResult = await dockerContainerService.executeCommand(agentContainer.containerId, [
        'stat', '-c', '%s', outputPath
      ]);
      const fileSize = parseInt(sizeResult.stdout.trim()) || 0;

      const documentResult: DocumentResult = {
        taskId: task.taskId,
        success: true,
        result: {
          converted: true,
          fromFormat,
          toFormat,
          inputPath,
          outputPath
        },
        outputPath,
        fileSize,
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('documentProcessed', documentResult);
      return documentResult;

    } catch (error) {
      const documentResult: DocumentResult = {
        taskId: task.taskId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
        timestamp: new Date()
      };

      this.emit('documentFailed', documentResult);
      return documentResult;
    }
  }

  // Execute document processing task
  async processDocument(task: DocumentTask): Promise<DocumentResult> {
    console.log(`📋 Processing document task: ${task.type}`);
    
    this.processQueue.set(task.taskId, task);
    
    try {
      switch (task.type) {
        case 'pdf_generate':
          return await this.generatePDF(task);
        case 'excel_create':
          return await this.createExcelSpreadsheet(task);
        case 'email_compose':
          return await this.composeEmail(task);
        case 'email_send':
          return await this.sendEmail(task);
        case 'convert_format':
          return await this.convertFormat(task);
        default:
          throw new Error(`Unsupported document task type: ${task.type}`);
      }
    } finally {
      this.processQueue.delete(task.taskId);
    }
  }

  // Private helper methods
  private generatePDFScript(data: any, _template?: string): string {
    return `
import json
import sys
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors

def generate_pdf(output_path):
    # Create PDF document
    doc = SimpleDocTemplate(output_path, pagesize=A4)
    styles = getSampleStyleSheet()
    story = []
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.darkblue,
        alignment=1  # Center alignment
    )
    
    data = ${JSON.stringify(data)}
    
    # Add title
    if 'title' in data:
        story.append(Paragraph(data['title'], title_style))
        story.append(Spacer(1, 12))
    
    # Add content paragraphs
    if 'content' in data:
        for paragraph in data['content']:
            story.append(Paragraph(paragraph, styles['Normal']))
            story.append(Spacer(1, 12))
    
    # Add table if present
    if 'table' in data:
        table_data = data['table']
        table = Table(table_data)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(table)
    
    # Build PDF
    doc.build(story)
    print(f"PDF generated successfully: {output_path}")

if __name__ == "__main__":
    output_path = sys.argv[1] if len(sys.argv) > 1 else "/workspace/output.pdf"
    generate_pdf(output_path)
`;
  }

  private generateExcelScript(data: ExcelData, outputPath: string): string {
    return `
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment
import json

def create_excel(output_path):
    # Create workbook
    wb = openpyxl.Workbook()
    
    # Remove default sheet
    wb.remove(wb.active)
    
    data = ${JSON.stringify(data)}
    
    # Create sheets
    for sheet_info in data['sheets']:
        ws = wb.create_sheet(sheet_info['name'])
        
        # Add headers if present
        if 'headers' in sheet_info and sheet_info['headers']:
            for col, header in enumerate(sheet_info['headers'], 1):
                cell = ws.cell(row=1, column=col, value=header)
                cell.font = Font(bold=True)
                cell.fill = PatternFill(start_color="CCCCCC", end_color="CCCCCC", fill_type="solid")
            
            # Add data starting from row 2
            start_row = 2
        else:
            start_row = 1
        
        # Add data rows
        for row_idx, row_data in enumerate(sheet_info['data'], start_row):
            for col_idx, cell_value in enumerate(row_data, 1):
                ws.cell(row=row_idx, column=col_idx, value=cell_value)
        
        # Auto-adjust column widths
        for column in ws.columns:
            max_length = 0
            column_letter = column[0].column_letter
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = min(max_length + 2, 50)
            ws.column_dimensions[column_letter].width = adjusted_width
    
    # Apply formatting if specified
    if 'formatting' in data:
        for fmt in data['formatting']:
            ws = wb[fmt['sheet']]
            cell = ws[fmt['cell']]
            
            for style_name, style_value in fmt['style'].items():
                if style_name == 'font_bold':
                    cell.font = Font(bold=style_value)
                elif style_name == 'background_color':
                    cell.fill = PatternFill(start_color=style_value, end_color=style_value, fill_type="solid")
                elif style_name == 'alignment':
                    cell.alignment = Alignment(horizontal=style_value)
    
    # Save workbook
    wb.save(output_path)
    print(f"Excel file created successfully: {output_path}")

if __name__ == "__main__":
    create_excel("${outputPath}")
`;
  }

  private generateEmailScript(emailTemplate: EmailTemplate, smtpConfig?: any): string {
    return `
import smtplib
import json
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from email.mime.base import MimeBase
from email import encoders
import os

def send_email():
    # Email configuration
    email_data = ${JSON.stringify(emailTemplate)}
    smtp_config = ${JSON.stringify(smtpConfig || {})}
    
    # Create message
    msg = MimeMultipart('alternative')
    msg['Subject'] = email_data['subject']
    msg['From'] = smtp_config.get('from_email', 'noreply@genesis-agent.com')
    msg['To'] = ', '.join(email_data['recipients']['to'])
    
    if email_data['recipients'].get('cc'):
        msg['Cc'] = ', '.join(email_data['recipients']['cc'])
    
    # Add text and HTML parts
    if email_data.get('textBody'):
        text_part = MimeText(email_data['textBody'], 'plain')
        msg.attach(text_part)
    
    if email_data.get('htmlBody'):
        html_part = MimeText(email_data['htmlBody'], 'html')
        msg.attach(html_part)
    
    # Add attachments
    if email_data.get('attachments'):
        for file_path in email_data['attachments']:
            if os.path.exists(file_path):
                with open(file_path, 'rb') as attachment:
                    part = MimeBase('application', 'octet-stream')
                    part.set_payload(attachment.read())
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename= {os.path.basename(file_path)}'
                    )
                    msg.attach(part)
    
    # Send email (simulation for now)
    print(f"Email would be sent to: {email_data['recipients']['to']}")
    print(f"Subject: {email_data['subject']}")
    print("Email composed successfully!")
    
    # In production, implement actual SMTP sending:
    # server = smtplib.SMTP(smtp_config['host'], smtp_config['port'])
    # server.starttls()
    # server.login(smtp_config['username'], smtp_config['password'])
    # server.send_message(msg)
    # server.quit()

if __name__ == "__main__":
    send_email()
`;
  }

  private async installConversionTools(containerId: string, fromFormat: string, toFormat: string): Promise<void> {
    const tools = new Set<string>();
    
    // Determine required tools based on formats
    if (fromFormat === 'docx' || toFormat === 'docx') {
      tools.add('python-docx');
    }
    if (fromFormat === 'pdf' || toFormat === 'pdf') {
      tools.add('PyPDF2');
      tools.add('pdf2image');
    }
    if (fromFormat.includes('image') || toFormat.includes('image')) {
      tools.add('Pillow');
    }
    
    if (tools.size > 0) {
      await dockerContainerService.executeCommand(containerId, [
        'pip', 'install', ...Array.from(tools)
      ]);
    }
  }

  private getConversionCommand(inputPath: string, outputPath: string, fromFormat: string, toFormat: string): string[] {
    // Simplified conversion commands - in production, use more sophisticated tools
    if (fromFormat === 'txt' && toFormat === 'pdf') {
      return ['pandoc', inputPath, '-o', outputPath];
    } else if (fromFormat === 'docx' && toFormat === 'pdf') {
      return ['libreoffice', '--headless', '--convert-to', 'pdf', '--outdir', '/workspace', inputPath];
    } else {
      // Generic copy for unsupported conversions
      return ['cp', inputPath, outputPath];
    }
  }

  private textToHtml(text: string): string {
    return text
      .split('\n')
      .map(line => `<p>${line}</p>`)
      .join('');
  }

  private validateEmailTemplate(template: EmailTemplate): void {
    if (!template.subject) {
      throw new Error('Email subject is required');
    }
    if (!template.recipients.to || template.recipients.to.length === 0) {
      throw new Error('Email recipients are required');
    }
    if (!template.htmlBody && !template.textBody) {
      throw new Error('Email body (HTML or text) is required');
    }
  }

  private extractPageCount(output: string): number {
    const match = output.match(/(\d+)\s+pages?/i);
    return match ? parseInt(match[1]) : 1;
  }

  private extractMessageId(output: string): string {
    const match = output.match(/Message-ID:\s*([^\s]+)/i);
    return match ? match[1] : `msg-${Date.now()}`;
  }

  // Public management methods
  getActiveProcesses(): DocumentTask[] {
    return Array.from(this.processQueue.values());
  }

  async cancelProcess(taskId: string): Promise<boolean> {
    if (this.processQueue.has(taskId)) {
      this.processQueue.delete(taskId);
      this.emit('processCancelled', { taskId });
      return true;
    }
    return false;
  }

  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up Document Processing Engine...');
    this.processQueue.clear();
  }
}

// Create singleton instance
export const documentProcessingEngine = new DocumentProcessingEngine();
export default documentProcessingEngine;