import { Quotation, Contract } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';
import pptxgen from 'pptxgenjs';
import { formatCurrency, formatDate } from './utils';

// Helper to render HTML to PDF using html2canvas
const renderToPDF = async (element: HTMLElement, fileName: string) => {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
  });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save(fileName);
};

export const exportToPDF = async (quotation: Quotation) => {
  const printArea = document.createElement('div');
  printArea.style.position = 'fixed';
  printArea.style.left = '-9999px';
  printArea.style.top = '0';
  printArea.style.width = '210mm'; // A4 width
  printArea.style.padding = '20mm';
  printArea.style.backgroundColor = 'white';
  printArea.style.color = 'black';
  printArea.style.fontFamily = '"Microsoft YaHei", "SimSun", sans-serif';

  printArea.innerHTML = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="font-size: 28px; margin-bottom: 10px;">活动报价单</h1>
      <div style="height: 2px; background-color: #007bff; width: 100%;"></div>
    </div>
    
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px;">
      <div>
        <p><strong>客户名称:</strong> ${quotation.clientName}</p>
        <p><strong>活动人数:</strong> ${quotation.headCount} 人</p>
        <p><strong>活动日期:</strong> ${formatDate(quotation.date)}</p>
      </div>
      <div style="text-align: right;">
        <p><strong>报价单号:</strong> QT-${quotation.id.substring(0, 8).toUpperCase()}</p>
        <p><strong>联系人:</strong> ${quotation.contactPerson || '-'}</p>
        <p><strong>联系电话:</strong> ${quotation.phone || '-'}</p>
      </div>
    </div>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 12px;">
      <thead>
        <tr style="background-color: #f8f9fa; border-bottom: 2px solid #dee2e6;">
          <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6;">项目名称</th>
          <th style="padding: 12px; text-align: center; border: 1px solid #dee2e6; width: 60px;">数量</th>
          <th style="padding: 12px; text-align: center; border: 1px solid #dee2e6; width: 60px;">天数</th>
          <th style="padding: 12px; text-align: right; border: 1px solid #dee2e6; width: 100px;">单价</th>
          <th style="padding: 12px; text-align: right; border: 1px solid #dee2e6; width: 100px;">小计</th>
        </tr>
      </thead>
      <tbody>
        ${quotation.items.map(item => `
          <tr style="border-bottom: 1px solid #dee2e6;">
            <td style="padding: 10px; border: 1px solid #dee2e6;">${item.name}</td>
            <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">${item.quantity}</td>
            <td style="padding: 10px; text-align: center; border: 1px solid #dee2e6;">${item.days}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">${formatCurrency(item.retailPrice)}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #dee2e6;">${formatCurrency(item.total)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div style="text-align: right; margin-top: 20px;">
      <p style="font-size: 18px; font-weight: bold; color: #007bff;">总计金额: ${formatCurrency(quotation.totalDiscounted)}</p>
      <p style="font-size: 14px; color: #6c757d;">人均单价: ${formatCurrency(quotation.perPerson)}</p>
    </div>

    <div style="margin-top: 50px; border-top: 1px solid #dee2e6; padding-top: 20px; text-align: center; font-size: 12px; color: #6c757d;">
      <p>感谢您的信任与支持！</p>
    </div>
  `;

  document.body.appendChild(printArea);
  await renderToPDF(printArea, `报价单_${quotation.clientName}.pdf`);
  document.body.removeChild(printArea);
};

export const exportToWord = async (quotation: Quotation) => {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: "活动报价单", bold: true, size: 32 })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ children: [new TextRun({ text: `客户名称: ${quotation.clientName}`, size: 24 })] }),
        new Paragraph({ children: [new TextRun({ text: `活动人数: ${quotation.headCount} 人`, size: 24 })] }),
        new Paragraph({ children: [new TextRun({ text: `活动日期: ${formatDate(quotation.date)}`, size: 24 })] }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph("项目名称")] }),
                new TableCell({ children: [new Paragraph("数量")] }),
                new TableCell({ children: [new Paragraph("天数")] }),
                new TableCell({ children: [new Paragraph("单价")] }),
                new TableCell({ children: [new Paragraph("小计")] }),
              ],
            }),
            ...quotation.items.map(item => new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(item.name)] }),
                new TableCell({ children: [new Paragraph(item.quantity.toString())] }),
                new TableCell({ children: [new Paragraph(item.days.toString())] }),
                new TableCell({ children: [new Paragraph(item.retailPrice.toString())] }),
                new TableCell({ children: [new Paragraph(item.total.toFixed(2))] }),
              ],
            })),
          ],
        }),
        new Paragraph({
          children: [new TextRun({ text: `总计金额: ${formatCurrency(quotation.totalDiscounted)}`, bold: true })],
          alignment: AlignmentType.RIGHT,
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `报价单_${quotation.clientName}.docx`;
  link.click();
};

export const exportToPPT = async (quotation: Quotation) => {
  const pres = new pptxgen();
  
  // Slide 1: Title
  const slide1 = pres.addSlide();
  slide1.addText("活动方案与报价", { x: 1, y: 1, w: '80%', h: 1, fontSize: 44, bold: true, color: '363636', align: 'center' });
  slide1.addText(quotation.clientName, { x: 1, y: 2.5, w: '80%', h: 1, fontSize: 32, color: '666666', align: 'center' });
  slide1.addText(`日期: ${formatDate(quotation.date)}`, { x: 1, y: 4, w: '80%', h: 0.5, fontSize: 18, color: '999999', align: 'center' });

  // Slide 2: Details
  const slide2 = pres.addSlide();
  slide2.addText("费用明细", { x: 0.5, y: 0.5, w: '90%', h: 0.5, fontSize: 24, bold: true });
  
  const rows = [
    ['项目', '数量', '天数', '单价', '总计'].map(text => ({ text, options: { bold: true, fill: 'F1F1F1' } })),
    ...quotation.items.map(item => [
      { text: item.name },
      { text: item.quantity.toString() },
      { text: item.days.toString() },
      { text: item.retailPrice.toString() },
      { text: item.total.toFixed(2) }
    ])
  ];
  
  slide2.addTable(rows, { x: 0.5, y: 1.2, w: 9, fontSize: 12, border: { type: 'solid', color: 'E1E1E1' } });
  
  // Slide 3: Summary
  const slide3 = pres.addSlide();
  slide3.addText("报价汇总", { x: 0.5, y: 0.5, w: '90%', h: 0.5, fontSize: 24, bold: true });
  slide3.addText(`总人数: ${quotation.headCount} 人`, { x: 1, y: 1.5, fontSize: 20 });
  slide3.addText(`总金额: ${formatCurrency(quotation.totalDiscounted)}`, { x: 1, y: 2.5, fontSize: 28, bold: true, color: '007BFF' });
  slide3.addText(`人均单价: ${formatCurrency(quotation.perPerson)}`, { x: 1, y: 3.5, fontSize: 20 });

  pres.writeFile({ fileName: `方案_${quotation.clientName}.pptx` });
};

export const exportContractToPDF = async (contract: Contract, quotation?: Quotation) => {
  const printArea = document.createElement('div');
  printArea.style.position = 'fixed';
  printArea.style.left = '-9999px';
  printArea.style.top = '0';
  printArea.style.width = '210mm';
  printArea.style.padding = '20mm';
  printArea.style.backgroundColor = 'white';
  printArea.style.color = 'black';
  printArea.style.fontFamily = '"Microsoft YaHei", "SimSun", sans-serif';

  printArea.innerHTML = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="font-size: 28px; margin-bottom: 10px;">活动服务合同</h1>
      <div style="height: 2px; background-color: #007bff; width: 100%;"></div>
    </div>
    
    <div style="display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px;">
      <div>
        <p><strong>甲方(客户):</strong> ${contract.clientName}</p>
        <p><strong>合同金额:</strong> ${formatCurrency(contract.amount)}</p>
      </div>
      <div style="text-align: right;">
        <p><strong>合同编号:</strong> ${contract.contractNumber}</p>
        <p><strong>签订日期:</strong> ${formatDate(contract.createdAt)}</p>
      </div>
    </div>

    <div style="margin-bottom: 30px;">
      <h3 style="font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">合同条款</h3>
      <div style="font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${contract.content}</div>
    </div>

    ${quotation ? `
      <div style="page-break-before: always; margin-top: 40px;">
        <h3 style="font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px;">附件：费用明细表</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <thead>
            <tr style="background-color: #f8f9fa; border-bottom: 2px solid #dee2e6;">
              <th style="padding: 10px; text-align: left; border: 1px solid #dee2e6;">项目名称</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6; width: 50px;">数量</th>
              <th style="padding: 10px; text-align: center; border: 1px solid #dee2e6; width: 50px;">天数</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #dee2e6; width: 90px;">单价</th>
              <th style="padding: 10px; text-align: right; border: 1px solid #dee2e6; width: 90px;">小计</th>
            </tr>
          </thead>
          <tbody>
            ${quotation.items.map(item => `
              <tr style="border-bottom: 1px solid #dee2e6;">
                <td style="padding: 8px; border: 1px solid #dee2e6;">${item.name}</td>
                <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">${item.quantity}</td>
                <td style="padding: 8px; text-align: center; border: 1px solid #dee2e6;">${item.days}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #dee2e6;">${formatCurrency(item.retailPrice)}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #dee2e6;">${formatCurrency(item.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    <div style="margin-top: 60px; display: flex; justify-content: space-between; font-size: 14px;">
      <div style="width: 45%;">
        <p>甲方盖章：____________________</p>
        <p style="margin-top: 20px;">日期：      年    月    日</p>
      </div>
      <div style="width: 45%;">
        <p>乙方盖章：____________________</p>
        <p style="margin-top: 20px;">日期：      年    月    日</p>
      </div>
    </div>
  `;

  document.body.appendChild(printArea);
  await renderToPDF(printArea, `合同_${contract.clientName}_${contract.contractNumber}.pdf`);
  document.body.removeChild(printArea);
};

export const printQuotation = (quotation: Quotation) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const content = `
    <html>
      <head>
        <title>打印报价单 - ${quotation.clientName}</title>
        <style>
          body { font-family: "Microsoft YaHei", "SimSun", sans-serif; padding: 40px; color: #333; }
          h1 { text-align: center; color: #000; }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f4f4f4; }
          .total { text-align: right; font-size: 20px; font-weight: bold; color: #007bff; }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <h1>活动报价单</h1>
        <div class="header">
          <div>
            <p><strong>客户名称:</strong> ${quotation.clientName}</p>
            <p><strong>活动人数:</strong> ${quotation.headCount} 人</p>
            <p><strong>活动日期:</strong> ${formatDate(quotation.date)}</p>
          </div>
          <div style="text-align: right;">
            <p><strong>报价单号:</strong> QT-${quotation.id.substring(0, 8).toUpperCase()}</p>
            <p><strong>联系人:</strong> ${quotation.contactPerson || '-'}</p>
            <p><strong>联系电话:</strong> ${quotation.phone || '-'}</p>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>项目名称</th>
              <th>数量</th>
              <th>天数</th>
              <th>单价</th>
              <th>小计</th>
            </tr>
          </thead>
          <tbody>
            ${quotation.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${item.days}</td>
                <td>${formatCurrency(item.retailPrice)}</td>
                <td>${formatCurrency(item.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="total">
          总计金额: ${formatCurrency(quotation.totalDiscounted)}
        </div>
        <p style="text-align: right; color: #666;">人均单价: ${formatCurrency(quotation.perPerson)}</p>
        <script>
          window.onload = () => {
            window.print();
            window.onafterprint = () => window.close();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();
};

export const printContract = (contract: Contract, quotation?: Quotation) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const content = `
    <html>
      <head>
        <title>打印合同 - ${contract.contractNumber}</title>
        <style>
          body { font-family: "Microsoft YaHei", "SimSun", sans-serif; padding: 40px; color: #333; line-height: 1.6; }
          h1 { text-align: center; color: #000; }
          .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
          .terms { white-space: pre-wrap; margin-bottom: 40px; }
          .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f4f4f4; }
          @media print {
            body { padding: 0; }
            .page-break { page-break-before: always; }
          }
        </style>
      </head>
      <body>
        <h1>活动服务合同</h1>
        <div class="header">
          <div>
            <p><strong>甲方(客户):</strong> ${contract.clientName}</p>
            <p><strong>合同金额:</strong> ${formatCurrency(contract.amount)}</p>
          </div>
          <div style="text-align: right;">
            <p><strong>合同编号:</strong> ${contract.contractNumber}</p>
            <p><strong>签订日期:</strong> ${formatDate(contract.createdAt)}</p>
          </div>
        </div>
        <h3>合同条款</h3>
        <div class="terms">${contract.content}</div>
        
        ${quotation ? `
          <div class="page-break">
            <h3>附件：费用明细表</h3>
            <table>
              <thead>
                <tr>
                  <th>项目名称</th>
                  <th>数量</th>
                  <th>天数</th>
                  <th>单价</th>
                  <th>小计</th>
                </tr>
              </thead>
              <tbody>
                ${quotation.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${item.days}</td>
                    <td>${formatCurrency(item.retailPrice)}</td>
                    <td>${formatCurrency(item.total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        <div class="signatures">
          <div style="width: 45%;">
            <p>甲方盖章：____________________</p>
            <p style="margin-top: 20px;">日期：      年    月    日</p>
          </div>
          <div style="width: 45%;">
            <p>乙方盖章：____________________</p>
            <p style="margin-top: 20px;">日期：      年    月    日</p>
          </div>
        </div>
        <script>
          window.onload = () => {
            window.print();
            window.onafterprint = () => window.close();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(content);
  printWindow.document.close();
};


export const exportToExcel = (quotation: Quotation) => {
  const data = quotation.items.map(item => ({
    '项目名称': item.name,
    '数量': item.quantity,
    '天数': item.days,
    '单价': item.retailPrice,
    '小计': item.total
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "报价明细");

  // Add summary info
  XLSX.utils.sheet_add_aoa(worksheet, [
    [],
    ['客户名称', quotation.clientName],
    ['活动人数', quotation.headCount],
    ['活动日期', formatDate(quotation.date)],
    ['总计金额', quotation.totalDiscounted],
    ['人均单价', quotation.perPerson]
  ], { origin: -1 });

  XLSX.writeFile(workbook, `报价单_${quotation.clientName}.xlsx`);
};
