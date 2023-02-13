import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DbconService } from "../../../services/dbcon.service";
import * as XLSX from 'xlsx';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';

const FILTER_PAG_REGEX = /[^0-9]/g;

interface DataSet {
  compositeKey: string;
  prodWarehouse: string;
  shipmentMode: string;
  destination: string;
  planDelDate: string;
  COQty: string;
  FOBPrice: string;
  productionFactory: string;
  mode:string;
  SAdestination: string;
  handOverDate: string;
  originalQty: string;
  BAFob: string;
}


@Component({
  selector: 'ngx-comparison-modal-olr',
  templateUrl: './comparison-modal-olr.component.html',
  styleUrls: ['./comparison-modal-olr.component.scss']
})
export class ComparisonModalOlrComponent {

  @ViewChild('content', { static: true }) content: TemplateRef<any>;

  data: DataSet[];
  closeResult = '';
  page = 1;
  pageSize = 20;
  collectionSize;
  fileName = "OLR_&_OB Comparison";

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
    console.log("Model 3 Opened ..........")
    this.data = data;
    this.collectionSize = this.data.length;
    this.modalService.open(this.content, { size: 'xl', scrollable: true  });
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
    const BffOLRArray = await this.DbconService.getAllArray(
      "bffOLR"
    );
    const OLRMatchedOBRows = [];
    for (const row of BffOLRArray) {
      const OBMatchedRow = await this.DbconService.getByIndex(
        "bffOrderBook",
        "OLRKey",
        row.OLRKey
      );
      // STEP3.1 - manupilate JSON objet for compare model
      let compositeKey, prodWarehouse, destination, shipmentMode, reqDeldate, planDelDate, COQty, FOBPrice ;
      if (OBMatchedRow) {
        compositeKey = row.OLRKeyUI,
        prodWarehouse = OBMatchedRow.prodWarehouse,
        destination = OBMatchedRow.destination,
        shipmentMode = OBMatchedRow.shipmentMode,
        reqDeldate = OBMatchedRow.reqDeldate,
        planDelDate = OBMatchedRow.planDelDate
        COQty = OBMatchedRow.COQty
        FOBPrice = OBMatchedRow.FOBPrice
      }else{
        compositeKey = row.OLRKeyUI,
        destination = "",
        prodWarehouse = "",
        shipmentMode = "",
        reqDeldate = "",
        planDelDate = "",
        COQty = "",
        FOBPrice = ""
      } 
      OLRMatchedOBRows.push({
        compositeKey: compositeKey,
        // OLR FILE Fields
        productionFactory: this.mapFactoryIDAndProdWH(row.FACTORYID),
        mode: row.SHIPMODE,
        SAdestination: this.mapOLRCustCodeAndOBDestination(row.CUSTCODE),
        orginalMode: this.formatExcelDateToDateObj(row.ORIGINALMOD),
        handOverDate: this.formatExcelDateToDateObj(row.SHIPDATE),
        originalQty: row.OLRORDERQtySum,
        BAFob: row.MIDDLEMANCHARGES+row.FACTORYCOST,
        blank: '',
        // OB FILE Fields
        prodWarehouse: prodWarehouse,
        shipmentMode: this.mapShipModeAndShipmentMode(shipmentMode),
        destination: destination,
        reqDeldate: this.formatOBDateForOOROTROLR(reqDeldate),
        planDelDate: this.formatOBDateForOOROTROLR(planDelDate), 
        COQty: COQty,
        FOBPrice: FOBPrice,
      });
    }

    const key = 'compositeKey'
    const OLRUniqueRow = [...new Map(OLRMatchedOBRows.map(item =>[item[key], item])).values()]
   
    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet("Sheet 1");

    let title =["","OLR Table","","","","","","","","Order Book Table" ]
    let titleRow = worksheet.addRow(title);
    let header=[
      "Key(VOPNo-CustomStyleNo-ColorName-StyleNo-COQty-Season)",
        "Production Factory",
        "Ship Mode",
        "Customer Code",
        "Original Mode",
        "Ship Date",
        "Size Wise",
        "Middle man chargers/Factory Cost",
        "",
        "Prod Warehouse",
        "Shipment Mode",
        "Destination",
        "Req Del Date",
        "Plan Del Date",
        "CO Qty",
        "FOB Price"
    ]
    let headerRow = worksheet.addRow(header);

    for (let x1 of OLRUniqueRow){
      let x2 = Object.keys(x1);
      let temp = []
      for(let y of x2)
      {
        temp.push(x1[y])
      }
      worksheet.addRow(temp)
    }

    for (let i = 0; i < OLRUniqueRow.length; i =i + 1){
      //prodware house
      if(JSON.stringify(OLRUniqueRow[i].productionFactory) !== JSON.stringify(OLRUniqueRow[i].prodWarehouse)){
        worksheet.getCell("B"+(3+i)).fill = {
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
      //shipmode
      if(JSON.stringify(OLRUniqueRow[i].mode) !== JSON.stringify(OLRUniqueRow[i].shipmentMode)){
        worksheet.getCell("C"+(3+i)).fill = {
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
      //destination
      if(JSON.stringify(OLRUniqueRow[i].SAdestination) !== JSON.stringify(OLRUniqueRow[i].destination)){
        worksheet.getCell("D"+(3+i)).fill = {
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

      //req date
      if(JSON.stringify(OLRUniqueRow[i].orginalMode) !== JSON.stringify(OLRUniqueRow[i].reqDeldate)){
        worksheet.getCell("E"+(3+i)).fill = {
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

      //plan date
      if(JSON.stringify(OLRUniqueRow[i].handOverDate) !== JSON.stringify(OLRUniqueRow[i].planDelDate)){
        worksheet.getCell("F"+(3+i)).fill = {
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

      //qty
      if(JSON.stringify(OLRUniqueRow[i].originalQty) !== JSON.stringify(OLRUniqueRow[i].COQty)){
        worksheet.getCell("G"+(3+i)).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
              argb: 'FF0000'
          }
        }
        worksheet.getCell("O"+(3+i)).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
              argb: 'FF0000'
          }
        }
      }

      //FOB
      if(JSON.stringify(OLRUniqueRow[i].BAFob) !== JSON.stringify(OLRUniqueRow[i].FOBPrice)){
        worksheet.getCell("H"+(3+i)).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
              argb: 'FF0000'
          }
        }
        worksheet.getCell("P"+(3+i)).fill = {
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

  //OB and OLR Mapping
  //OLR Factory Id and OB-InternalPlantCode
  mapFactoryIDAndProdWH(value){
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

  //OLR Shipmode and OB shipment Mode
  mapShipModeAndShipmentMode(value){
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

  //OLR Cust code And OB Destination
  mapOLRCustCodeAndOBDestination(value){
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
