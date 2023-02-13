import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as XLSX from 'xlsx';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
//import * as fs from 'fs';
import { DbconService } from "../../../services/dbcon.service";


interface DataSet {
  compositeKey: string;
  prodWarehouse: string;
  shipmentMode: string;
  reqDeldate: string;
  planDelDate: string;
  COQty: string;
  factoryVendor: string;
  modeOfShip: string;
  originalMastOwnershipDate: string;
  planMASTOwnershipDate: string;
  orderQuantity: string;
}

const FILTER_PAG_REGEX = /[^0-9]/g;

//export declare type NbComponentSize = 'tiny' | 'small' | 'medium' | 'large' | 'giant';

@Component({
  selector: 'ngx-comparison-model',
  templateUrl: './comparison-model.component.html',
  styleUrls: ['./comparison-model.component.scss']
})
export class ComparisonModelComponent {

  @ViewChild('content', { static: true }) content: TemplateRef<any>;

  data: DataSet[];
  closeResult = '';
  page = 1;
  pageSize = 20;
  collectionSize;

  fileName = "OOR_&_OB_Comparison"

  constructor(private DbconService: DbconService, public modalService: NgbModal) { }

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
    console.log("Model 1 Opened ..........")
    this.data = data;
    this.collectionSize = this.data.length;
    this.modalService.open(this.content, { size: 'xl', scrollable: true });
  }

  refresh() {
    this.data
      .map((data, i) => ({ id: i + 1, ...data }))
      .slice((this.page - 1) * this.pageSize, (this.page - 1) * this.pageSize + this.pageSize);
  }

  selectPage(page: string) {
    this.page = parseInt(page, 10) || 1;
  }

  formatInput(input: HTMLInputElement) {
    input.value = input.value.replace(FILTER_PAG_REGEX, '');
  }

  async downloadExcel()
  {

    const BffOORArray = await this.DbconService.getAllArray(
      "bffOOR"
    );
    const OORMatchedOBRows = [];
    for (const row of BffOORArray) {
      const OBMatchedRow = await this.DbconService.getByIndex(
        "bffOrderBook",
        "OORKey",
        row.OORKey
      );
      // STEP3.1 - manupilate JSON objet for compare model
      let compositeKey, prodWarehouse, shipmentMode, reqDeldate, planDelDate, COQty;
      if (OBMatchedRow) {
        compositeKey = row.OORKeyUI,
        prodWarehouse = OBMatchedRow.prodWarehouse,
        shipmentMode = OBMatchedRow.shipmentMode,
        reqDeldate = OBMatchedRow.reqDeldate,
        planDelDate = OBMatchedRow.planDelDate
        COQty = OBMatchedRow.COQty
      }else{
        compositeKey = row.OORKeyUI,
        prodWarehouse = "",
        shipmentMode = "",
        reqDeldate = "",
        planDelDate = "",
        COQty = ""
      }
      OORMatchedOBRows.push({
        compositeKey: compositeKey,
        // OOR FILE Fields
        factoryVendor: this.mapProdWHAndFV(row.factoryVendor),
        modeOfShip: row.modeOfShip,
        originalMastOwnershipDate: this.formatExcelDateToDateObj(row.originalMastOwnershipDate),
        planMASTOwnershipDate: this.formatExcelDateToDateObj(row.planMASTOwnershipDate),
        orderQuantity: row.orderQuantity,
        blank: '',
        // OB FILE Fields
        prodWarehouse: prodWarehouse,
        shipmentMode: this.mapOBShipmentModeAndOORMoS(shipmentMode),
        reqDeldate: this.formatOBDateForOOROTROLR(reqDeldate),
        planDelDate: this.formatOBDateForOOROTROLR(planDelDate),
        COQty: COQty,
      });
    }

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet("Sheet 1");

    let title =["","OOR Table","","","","","","","Order Book Table" ]
    let titleRow = worksheet.addRow(title);
    let header=[
      "Key(Season-ColorName-CustomStyleNo-VOPNo-COQty)",
      "Factory Vendor",
      "Mode of Ship",
      "Original Mast Ownership Date",
      "Plan Mast Ownership Date",
      "Order Quantity",
      "",
      "Prod Warehouse",
      "Shipment Mode",
      "Req Del Date",
      "Plan Del Date",
      "CO Qty"
    ]
    let headerRow = worksheet.addRow(header);

    for (let x1 of OORMatchedOBRows){
      let x2 = Object.keys(x1);

      let temp = []
      for(let y of x2)
      {
        temp.push(x1[y])
      }
      worksheet.addRow(temp)
    }

    for (let i = 0; i < OORMatchedOBRows.length; i =i + 1){
      //prodware house
      if(JSON.stringify(OORMatchedOBRows[i].factoryVendor) !== JSON.stringify(OORMatchedOBRows[i].prodWarehouse)){
        worksheet.getCell("B"+(3+i)).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
              argb: 'FF0000'
          }
        }
        worksheet.getCell("H"+(3+i)).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
              argb: 'FF0000'
          }
        }
      }

      //mode
      if(JSON.stringify(OORMatchedOBRows[i].modeOfShip) !== JSON.stringify(OORMatchedOBRows[i].shipmentMode)){
        worksheet.getCell("C"+(3+i)).fill = {
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

      //req date
      if(JSON.stringify(OORMatchedOBRows[i].originalMastOwnershipDate) !== JSON.stringify(OORMatchedOBRows[i].reqDeldate)){
        worksheet.getCell("D"+(3+i)).fill = {
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

      //plan date
      if(JSON.stringify(OORMatchedOBRows[i].planMASTOwnershipDate) !== JSON.stringify(OORMatchedOBRows[i].planDelDate)){
        worksheet.getCell("E"+(3+i)).fill = {
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

      //Qty
      if(JSON.stringify(OORMatchedOBRows[i].orderQuantity) !== JSON.stringify(OORMatchedOBRows[i].COQty)){
        worksheet.getCell("F"+(3+i)).fill = {
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

  //OB and OOR Mapping
  //Prod Warehouse and Factory vendor
  mapProdWHAndFV(value){
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

  //OB - Shipment Mode and OOR - Mode Of Ship
  mapOBShipmentModeAndOORMoS(value){
    switch (value) {
      case "SEA":
        return "OCEAN";
      case "ARC":
        return "AIR";
      case "ARP":
        return "FACTORY AIR";
      case "CRP":
        return "AIR";
      case "ASP":
        return "AIR";
      case "AIR":
        return "AIR";
      case "SAB":
        return "AIR";
      case "CRC":
        return "AIR";
      case "SAV":
        return "AIR";
      case "SAC":
        return "OCEAN";
      case "SEP":
        return "OCEAN";
      default:
        return value;
    }
  }

}
