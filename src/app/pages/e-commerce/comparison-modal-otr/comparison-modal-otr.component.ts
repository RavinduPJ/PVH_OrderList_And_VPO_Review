import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as XLSX from 'xlsx';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
import { DbconService } from "../../../services/dbcon.service";

const FILTER_PAG_REGEX = /[^0-9]/g;

interface DataSet {
  compositeKey: string;
  prodWarehouse: string;
  shipmentMode: string;
  destination: string;
  reqDeldate: string;
  planDelDate: string;
  COQty: string;
  originalFtySAP: string;
  confirmedShipMode: string;
  customerCode: string;
  OMODOriginalGAC: string;
  currentSystemMODGAC: string;
  qty: string;
}

@Component({
  selector: 'ngx-comparison-modal-otr',
  templateUrl: './comparison-modal-otr.component.html',
  styleUrls: ['./comparison-modal-otr.component.scss']
})
export class ComparisonModalOtrComponent {

  @ViewChild('content', { static: true }) content: TemplateRef<any>;

  data: DataSet[];
  closeResult = '';
  page = 1;
  pageSize = 20;
  collectionSize;

  fileName = "OTR_&_OB_Comparison";

  constructor(private DbconService: DbconService, private modalService: NgbModal) { }

  open() {
    this.modalService.open(this.content, { ariaLabelledBy: 'modal-basic-title' }).result.then((result) => {
      this.closeResult = `Closed with: ${result}`;
    }, (reason) => {
      this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
    });
  }

  private getDismissReason(reason: any): string {
    if (reason === ModalDismissReasons.ESC) {
      return 'by pressing ESC';
    } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
      return 'by clicking on a backdrop';
    } else {
      return `with: ${reason}`;
    }
  }

  openModel(data) {
    console.log("Model 2 Opened ..........")
    this.data = data;
    this.collectionSize = this.data.length;
    this.modalService.open(this.content, { size: 'xl', scrollable: true });
  }

  downloadExcel(): void
  {
    /* pass here the table id */
    let element = document.getElementById('table');
    const ws: XLSX.WorkSheet =XLSX.utils.table_to_sheet(element);
 
    /* generate workbook and add the worksheet */
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
 
    /* save to file */  
    XLSX.writeFile(wb, this.fileName+'.xlsx');
 
  }

  async downloadToExcel() 
  {
    const BffOTRArray = await this.DbconService.getAllArray(
      "bffOTR"
    );
    const OTRMatchedOBRows = [];
    for (const row of BffOTRArray) {
      const OBMatchedRow = await this.DbconService.getByIndex(
        "bffOrderBook",
        "OTRKey",
        row.OTRKey
      );
      // STEP3.1 - manupilate JSON objet for compare model
      let compositeKey, prodWarehouse, destination, shipmentMode, reqDeldate, planDelDate, COQty;
      if (OBMatchedRow) {
        compositeKey = row.OTRKeyUI,
        prodWarehouse = OBMatchedRow.prodWarehouse,
        destination = OBMatchedRow.destination,
        shipmentMode = OBMatchedRow.shipmentMode,
        reqDeldate = OBMatchedRow.reqDeldate,
        planDelDate = OBMatchedRow.planDelDate
        COQty = OBMatchedRow.COQty
      }else{
        compositeKey = row.OTRKeyUI,
        destination = "",
        prodWarehouse = "",
        shipmentMode = "",
        reqDeldate = "",
        planDelDate = "",
        COQty = ""
      } 
      OTRMatchedOBRows.push({
        compositeKey: compositeKey,
         // OTR FILE Fields
         originalFtySAP: this.mapOFtySAPAndProdWH(row.originalFtySAP),
         confirmedShipMode: row.confirmedShipMode,
         customerCode: this.mapOTRDestinationAndOBCustomerCode(row.customerCode),
         OMODOriginalGAC: this.formatExcelDateToDateObj(row.OMODOriginalGAC),
         currentSystemMODGAC: this.formatExcelDateToDateObj(row.currentSystemMODGAC),
         qty: row.qty,
         blank: '',
        // OB FILE Fields
        prodWarehouse: prodWarehouse,
        shipmentMode: this.mapOBShipmentModeAndOTRCSM(shipmentMode),
        destination: destination,
        reqDeldate: this.formatOBDateForOOROTROLR(reqDeldate),
        planDelDate: this.formatOBDateForOOROTROLR(planDelDate),
        COQty: COQty,
       
      });
    }
    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet("Sheet 1");

    let title =["","OTR Table","","","","","","","","Order Book Table" ]
    let titleRow = worksheet.addRow(title);
    let header=[
      "Key(Season-CustomStyleNo-VOPNo-ColorName-COQty)",
        "Original Fty SAP #",
        "Confirmed Ship Mode",
        "Customer Code",
        "OMOD (Original GAC)",
        "Current System MOD (GAC)",
        "Qty",
        "",
        "Prod Warehouse",
        "Shipment Mode",
        "Destination",
        "Req Del Date",
        "Plan Del Date",
        "CO Qty"
    ]
    let headerRow = worksheet.addRow(header);

    for (let x1 of OTRMatchedOBRows){
      let x2 = Object.keys(x1);
      let temp = []
      for(let y of x2)
      {
        temp.push(x1[y])
      }
      worksheet.addRow(temp)
    }

    for (let i = 0; i < OTRMatchedOBRows.length; i =i + 1){
      //prodware house
      if(JSON.stringify(OTRMatchedOBRows[i].originalFtySAP) !== JSON.stringify(OTRMatchedOBRows[i].prodWarehouse)){
        worksheet.getCell("B"+(3+i)).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
              argb: 'FF0000'
          }
        }
        worksheet.getCell("I"+(3+i)).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
              argb: 'FF0000'
          }
        }
      }

      //mode
      if(JSON.stringify(OTRMatchedOBRows[i].confirmedShipMode) !== JSON.stringify(OTRMatchedOBRows[i].shipmentMode)){
        worksheet.getCell("C"+(3+i)).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
              argb: 'FF0000'
          }
        }
        worksheet.getCell("J"+(3+i)).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
              argb: 'FF0000'
          }
        }
      }

      //dest
      if(JSON.stringify(OTRMatchedOBRows[i].customerCode) !== JSON.stringify(OTRMatchedOBRows[i].destination)){
        worksheet.getCell("D"+(3+i)).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
              argb: 'FF0000'
          }
        }
        worksheet.getCell("K"+(3+i)).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
              argb: 'FF0000'
          }
        }
      }

      //req date
      if(JSON.stringify(OTRMatchedOBRows[i].OMODOriginalGAC) !== JSON.stringify(OTRMatchedOBRows[i].reqDeldate)){
        worksheet.getCell("E"+(3+i)).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
              argb: 'FF0000'
          }
        }
        worksheet.getCell("L"+(3+i)).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
              argb: 'FF0000'
          }
        }
      }

      //plan date
      if(JSON.stringify(OTRMatchedOBRows[i].currentSystemMODGAC) !== JSON.stringify(OTRMatchedOBRows[i].planDelDate)){
        worksheet.getCell("F"+(3+i)).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
              argb: 'FF0000'
          }
        }
        worksheet.getCell("M"+(3+i)).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
              argb: 'FF0000'
          }
        }
      }

      //qty
      if(JSON.stringify(OTRMatchedOBRows[i].qty) !== JSON.stringify(OTRMatchedOBRows[i].COQty)){
        worksheet.getCell("G"+(3+i)).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
              argb: 'FF0000'
          }
        }
        worksheet.getCell("N"+(3+i)).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
              argb: 'FF0000'
          }
        }
      }
    }
    workbook.xlsx.writeBuffer().then((data) => {
      let blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      fs.saveAs(blob, this.fileName+'.xlsx');
    });
  }

  // Util functions
  readExcelFile(file, headers): Promise<any> {
    return new Promise<any>((resolve) => {
      let workBook = null;
      let sheetToJsonData = null;
      const reader = new FileReader();

      reader.onload = () => {
        const data = reader.result;
        workBook = XLSX.read(data, { type: "binary", cellDates: false });
        sheetToJsonData = workBook.SheetNames.reduce((initial, name) => {
          const sheet = workBook.Sheets[name];
          initial.sheet = XLSX.utils.sheet_to_json(sheet, {
            header: headers,
            range: 1,
          });
          return initial;
        }, {});
        resolve(sheetToJsonData.sheet);
      };
      reader.readAsBinaryString(file);
    });
  }

  groupArray(list, key) {
    return list.reduce((a, item) => {
      (a[item[key]] = a[item[key]] || []).push(item);
      return a;
    }, {});
  }

  formatBytes(bytes, decimals = 2) { 
    if (bytes === 0) {
      return "0 Bytes";
    }
    const k = 1024;
    const dm = decimals <= 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  }

  formatToString(val){
    if((val == null)){
      val = "";
      return val
    }else{
      val = val.toString()
      return val
    }
  }

  formatCharAt(val, position){
    if((val == null)){
      val = "";
      return val
    }else{
      val = val.toString().charAt(position)
      return val
    }
  }

  formatSubString(val, position){
    if((val == null)){
      val = "";
      return val
    }else{
      val = val.toString().substring(0, position)
      return val
    }
  }

  formatSubStringRyt(val, position){
    if((val == null)){
      val = "";
      return val;
    }else{
      val = val.toString().substr(val.toString().length - position)
      return val;
    }
  }
  
  formatDatesOB(date){
    var day = this.formatSubStringRyt(date, 2) ;
    var month = `${this.formatCharAt(date,4)}${this.formatCharAt(date,5)}`;
    var year = this.formatSubString(date,4);

    const convertedDate =  year + '-' + month + '-' + day ;

    return convertedDate;
  }

  formatExcelDateToDateObj(serial){ 
    if (!!serial){
      const utc_days  = Math.floor(serial - 25569);
      const utc_value = utc_days * 86400;
      const date_info = new Date(utc_value * 1000);
      const fractional_day = serial - Math.floor(serial) + 0.0000001;
      let total_seconds = Math.floor(86400 * fractional_day);
      const seconds = total_seconds % 60;
      total_seconds -= seconds;
      const hours = Math.floor(total_seconds / (60 * 60));
      const minutes = Math.floor(total_seconds / 60) % 60;

      let convertedDate = new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
      let cd = this.formatDate(convertedDate);
      return cd;
    } else {
      return null;
    }
  }

  formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) 
        month = '0' + month;
    if (day.length < 2) 
        day = '0' + day;
    return [year, month, day].join('-');
  }

  formatOBDateForOOROTROLR(date){
    if(date){
      var day = this.formatSubStringRyt(date, 2) ;
      var month = `${this.formatCharAt(date,4)}${this.formatCharAt(date,5)}`;
      var year = this.formatSubString(date,4);
  
      const convertedDate =  year + '-' + month + '-' + day ;
      var d = new Date(convertedDate);
  
      // add a day
      d.setDate(d.getDate() + 1);
      const  cd = this.formatDate(d)
  
      return cd;
    }else{
      return null
    }
  }

  //OB and OTR Mapping
  //OTR-OFtySAP# and OB-InternalPlantCode 
  mapOFtySAPAndProdWH(value){
    switch (value) {
      case "36013821":
        return "N09";
      case "36013778":
        return "N03";
      case "36013805":
        return "N01";
      case "36014510":
        return "N32";
      case "36013804":
        return "N02";
      case "36014086":
        return "N32";
      case "36013816":
        return "N31";
      case "36014610":
        return "N35";
      case "36013811":
        return "N23";
      default:
        return value;
    }
  }

  //OTR Confirmed Ship Mode and OB Shipment Mode
  mapOBShipmentModeAndOTRCSM(value){
    switch (value) {
      case "SEA":
        return "Ocean";
      case "ARC":
        return "Air";
      case "ARP":
        return "Factory Air";
      case "CRP":
        return "Air";
      case "ASP":
        return "Air";
      case "AIR":
        return "Air";
      case "SAB":
        return "Air";
      case "CRC":
        return "Air";
      case "SAV":
        return "Air";
      case "SAC":
        return "Ocean";
      case "SEP":
        return "Ocean";
      default:
        return value;
    }
  }

  //OTR Destination and OB Customer Code 
  mapOTRDestinationAndOBCustomerCode(value){
    switch (value) {
      case "ARINT1106":
        return "USA03";
      case "ARINT1283":
        return "CHN01";
      case "10007507":
        return "GBR01";
      case "ARINT1225":
        return "GBR01";
      case "1393":
        return "USA15";
      case "ARINT1104":
        return "USA02";
      default:
        return value;
    }
  }
}
