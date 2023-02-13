import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as XLSX from 'xlsx';
import { DbconService } from "../../../services/dbcon.service";
import "../bff.component";
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
  selector: 'ngx-comparison-modal-shipment',
  templateUrl: './comparison-modal-shipment.component.html',
  styleUrls: ['./comparison-modal-shipment.component.scss']
})
export class ComparisonModalShipmentComponent {

  @ViewChild('content', { static: true }) content: TemplateRef<any>;

  data: DataSet[];
  closeResult = '';
  page = 1;
  pageSize = 20;
  collectionSize;

  fileName = "SA_&_OB Comparison";

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
    const BffSAArray = await this.DbconService.getAllArray(
      "bffSA"
    );
    const SAMatchedOBRows = [];
    for (const row of BffSAArray) {
      const OBMatchedRow = await this.DbconService.getByIndex(
        "bffOrderBook",
        "SAKey",
        row.SAKey
      );
      // STEP3.1 - manupilate JSON objet for compare model
      let compositeKey, prodWarehouse, destination, shipmentMode, reqDeldate, planDelDate, COQty, FOBPrice ;
      if (OBMatchedRow) {
        compositeKey =  row.SAKeyUI,
        prodWarehouse = OBMatchedRow.prodWarehouse,
        destination = OBMatchedRow.destination,
        shipmentMode = OBMatchedRow.shipmentMode,
        reqDeldate = OBMatchedRow.reqDeldate,
        planDelDate = OBMatchedRow.planDelDate
        COQty = OBMatchedRow.COQty
        FOBPrice = OBMatchedRow.FOBPrice
      }else{
        compositeKey = row.SAKeyUI,
        destination = "",
        prodWarehouse = "",
        shipmentMode = "",
        reqDeldate = "",
        planDelDate = "",
        COQty = "",
        FOBPrice = ""
      } 
      SAMatchedOBRows.push({
        // TODO - logic should apply here
        compositeKey: compositeKey,
        // SA FILE Fields
        productionFactory: this.mapSAProductionFactoryAndOBProdWH(row.productionFactory),
        mode: row.mode,
        SAdestination: this.mapSADestinationAndOBDestination(row.destination),
        handOverDate: this.formatExcelDateToDateObj(row.handOverDate),
        originalQty: row.originalQty,
        BAFob: row.BAFob,
        blank:'',
        // OB FILE Fields
        prodWarehouse: prodWarehouse,
        shipmentMode: this.mapOBShipmentModeAndSAMode(shipmentMode),
        destination: destination,
        planDelDate: this.formatDatesOB(planDelDate),
        COQty: COQty,
        FOBPrice: FOBPrice,
      });
    }
    
    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet("Sheet 1");

    let title =["","SA Table","","","","","","","Order Book Table" ]
    let titleRow = worksheet.addRow(title);
    let header=[
        "Key(CustomStyleNo-ColorName-VOPNo-COQty)",
        "Production Factory",
        "Mode",
        "Destination",
        "Hand Over Date",
        "Original Qty",
        "BA FOB",
        "",
        "Prod Warehouse",
        "Shipment Mode",
        "Destination",
        "Plan Del Date",
        "CO Qty",
        "FOB Price"
    ]
    let headerRow = worksheet.addRow(header);

    for (let x1 of SAMatchedOBRows){
      let x2 = Object.keys(x1);
      let temp = []
      for(let y of x2)
      {
        temp.push(x1[y])
      }
      worksheet.addRow(temp)
    }

    for (let i = 0; i < SAMatchedOBRows.length; i =i + 1){
      //prodware house
      if(JSON.stringify(SAMatchedOBRows[i].productionFactory) !== JSON.stringify(SAMatchedOBRows[i].prodWarehouse)){
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
      if(JSON.stringify(SAMatchedOBRows[i].mode) !== JSON.stringify(SAMatchedOBRows[i].shipmentMode)){
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
      if(JSON.stringify(SAMatchedOBRows[i].SAdestination) !== JSON.stringify(SAMatchedOBRows[i].destination)){
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

      //plan date
      if(JSON.stringify(SAMatchedOBRows[i].handOverDate) !== JSON.stringify(SAMatchedOBRows[i].planDelDate)){
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

      //Qty
      if(JSON.stringify(SAMatchedOBRows[i].originalQty) !== JSON.stringify(SAMatchedOBRows[i].COQty)){
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

      //FOB
      if(JSON.stringify(SAMatchedOBRows[i].BAFob) !== JSON.stringify(SAMatchedOBRows[i].FOBPrice)){
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
  
  //OB and SA Mapping
  //OB Shipment Mode and SA Mode
  mapOBShipmentModeAndSAMode(value){
    switch (value) {
      case "SEA":
        return "SEA";
      case "ARC":
        return "AIR";
      case "ARP":
        return "AIR";
      case "CRP":
        return "COURIER";
      default:
        return value;
    }
  }

  //SA Destination and OB Destination 
  mapSADestinationAndOBDestination(value){
    switch (value) {
      case "CAN01":
        return "CAN01";
      case "CAN02":
        return "CAN02";
      case "US01":
        return "US01";
      case "USA03":
        return "USA03";
      case "GBR01":
        return "GBR01";
      case "CHN01":
        return "CHN01";  
      default:
        return value;
    }
  }

  //SA Destination and OB Destination 
  mapSAProductionFactoryAndOBProdWH(value){
    switch (value) {
      case "N09 - BASL - Avissawella I Prod WH":
        return "N09";
      case "N03 - BIA - Minuwangoda Prod WH":
        return "N03";
      case "N01 - BASL - Mirigama Prod WH":
        return "N01";
      case "N27 - BASL - Avissavella II -Prod WH":
        return "N27";
      case "N34 - BASL_BFF -Sub_Watupitiwala":
        return "N34";
      case "N12 - BIA - Welisara Sub Con Prod WH ":
        return "N12";
      case "N33 -BASL_BFF_Sub (BCW)Prod WH":
        return "N33";
      case "N02 - BASL - Welisara Prod WH":
        return "N02";
      case "N23 - BASL - Mirigama II Prod WH":
        return "N23";
      default:
        return value;
    }
  }


}
