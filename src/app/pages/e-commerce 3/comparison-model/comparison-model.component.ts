import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as XLSX from 'xlsx';
import { Workbook } from 'exceljs';
import * as fs from 'file-saver';
//import * as fs from 'fs';
import { DbconService } from "../../../services/dbcon.service";


interface DataSet {
  compositeKey: string;
  FOBPrice: string;
  ReqDelDate: string;
  PlanDelDate: string;
  GarmentFabrication: string;
  DeliveryTerm: string;
  ShipmentMode: string;
  COQty: string;
  UnitPrice: string;
  SWED: string;
  FabricContent: string;
  DeliveryTerm1: string;
  LineShipMethod: string;
  CustomsUnits: string;
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

  fileName = "OB_&_GTN_Comparison"

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

    const BffPVHSSArray = await this.DbconService.getAllArray(
      "pvhss"
    );
    const OORMatchedOBRows = [];
    for (const row of BffPVHSSArray) {
      const OBMatchedRow = await this.DbconService.getByIndex(
        "aplob",
        "APLOBVPOKey",
        row.PVHSSVPOKey
        );
        console.log("OBMatchedRow" + OBMatchedRow);
        console.log(row);
        // STEP3.1 - manupilate JSON objet for compare model
      let compositeKey, VPONo, CustStyleNo, ColorName, GarmentFabrication, ReqDelDate, COQty, FOBPrice, Destination, PlannerDelDate, ShipmentMode, DeliveryTerm, StyleNo, ProductGroup, CPO, ZOption;
      if (OBMatchedRow) {
        compositeKey = row.PVHSSVPOKey,

        VPONo = OBMatchedRow.VPONo,
        CustStyleNo = OBMatchedRow.CustStyleNo,
        ColorName = OBMatchedRow.ColorName,

        GarmentFabrication = OBMatchedRow.GarmentFabrication,
        ReqDelDate = OBMatchedRow.ReqDelDate,
        COQty = OBMatchedRow.COQty,
        FOBPrice = OBMatchedRow.FOBPrice,
        Destination = OBMatchedRow.Destination,
        PlannerDelDate = OBMatchedRow.PlanDelDate,
        ShipmentMode = OBMatchedRow.ShipmentMode,
        DeliveryTerm = OBMatchedRow.DeliveryTerm,
        StyleNo = OBMatchedRow.StyleNo,
        CPO = OBMatchedRow.CPONo,
        ZOption = OBMatchedRow.ZOption
      }else{
        compositeKey = row.PVHSSKeyUI,
        GarmentFabrication = "",
        ReqDelDate = "",
        COQty = "",
        FOBPrice = "",
        Destination = "",
        PlannerDelDate = "",
        ShipmentMode = "",
        DeliveryTerm = "",
        StyleNo = "",
        CPO = "",
        ZOption = ""
      }
      OORMatchedOBRows.push({
        compositeKey: compositeKey,
        // OB FILE Fields
        FOBPrice: FOBPrice,
        ReqDelDateComp: this.addDays(this.formatDatesOB(ReqDelDate), 7),
        PlanDelDateComp: this.addDays(this.formatDatesOB(PlannerDelDate), 9),
        GarmentFabrication:this.mapFabricContentandGarmentFabrication(GarmentFabrication),
        DeliveryTerm: DeliveryTerm,
        ShipmentModeComp: this.mapShipMode(ShipmentMode),
        COQty: COQty,
        Clear: "",
        UnitPrice: row.UnitPrice,
        SWED: this.formatDatesOB(row.ShipWindowEndDate),
        FabricContentComp: row.FabricContent,
        DeliveryTerm1: row.DeliveryTerm,
        LineShipMethod: row.LineShipmentMethod,
        CustomsUnits: row.CustomsUnits
      });
    }

    let workbook = new Workbook();
    let worksheet = workbook.addWorksheet("Sheet 1");

    let title =["","OB Table","","","","","","","","GTN Table" ]
    let titleRow = worksheet.addRow(title);
    let header=[
      "Key",
      "FOB Price",
      "Req Del Date",
      "Plan Del Date",
      "Garment Fabrication",
      "Delivery Term",
      "Shipment Mode",
      "CO Qty",
      "",
      "Unit Price",
      "Shipment Window End Date",
      "Fiber Content",
      "Delivery Term",
      "Last Shipment Method",
      "Customs Units"
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
      if(JSON.stringify(OORMatchedOBRows[i].FOBPrice) !== JSON.stringify(OORMatchedOBRows[i].UnitPrice)){
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

      //mode
      if(JSON.stringify(OORMatchedOBRows[i].ReqDelDateComp) !== JSON.stringify(OORMatchedOBRows[i].SWED)){
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

      //req date
      if(JSON.stringify(OORMatchedOBRows[i].PlanDelDateComp) !== JSON.stringify(OORMatchedOBRows[i].SWED)){
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
      if(JSON.stringify(OORMatchedOBRows[i].GarmentFabrication) !== JSON.stringify(OORMatchedOBRows[i].FabricContentComp)){
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
      if(!(JSON.stringify(OORMatchedOBRows[i].DeliveryTerm1).includes(JSON.stringify(OORMatchedOBRows[i].DeliveryTerm)))){
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
      
    if(JSON.stringify(OORMatchedOBRows[i].ShipmentModeComp) !== JSON.stringify(OORMatchedOBRows[i].LineShipMethod)){
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
    
    if(JSON.stringify(OORMatchedOBRows[i].COQty) !== JSON.stringify(OORMatchedOBRows[i].CustomsUnits)){
        worksheet.getCell("H"+(3+i)).fill = {
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

  mapDeliveryTerm(value){
    if(value.includes("FOB")){
      return "FOB";
    }
    else if(value.includes("FCA")){
      return "FCA";
    }else{
      return value;
    }
  }

  mapAvailability(value1, value2){
    if(value1){
      return value1;
    }else{
      return value2;
    }
  }

  addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return this.convert(result);
  }

  convert(str) {
    var date = new Date(str),
      mnth = ("0" + (date.getMonth() + 1)).slice(-2),
      day = ("0" + date.getDate()).slice(-2);
    return [date.getFullYear(), mnth, day].join("-");
  }

  mapCostLogLogic(value1, MMX, BUR, ROSS){
    
    // const stringLength = value1.length();
    // console.log(value1 + " - " + stringLength);

    if(this.formatToString(value1).includes("X")== true){
      return MMX;
    }
    else if (this.formatToString(value1).includes("U")== true){
      return BUR;
    }
    else if (this.formatToString(value1).includes("R")== true){
      return ROSS;
    }
    else {
      return value1;
    }
  }

  mapShipMode(value){
    switch(value){
      case "SEA":
        return "Ocean";
      case "AIR":
        return "AIR";
      default:
        return value; 
    }
  }

  mapFabricContentandGarmentFabrication(value){
    switch(value){
      case "POLY75NY25":
        return "PES 75 % PA 25%";
      case "MDL97EL3":
        return "97% MICRO MODAL 3% SPANDEX";
      case "CT96SP4":
        return "96% COTTON 4% ELASTANE";
      case "ORG100CTTN":
        return "100% COTTON";
      case "67BM28CT5E":
        return "67% BAMBOO 28% COTTON 5% ELASTANE";
      case "CT100":
        return "100% COTTON";
      case "CT98EL2":
        return "CO 98 % EL 2 %/98% COTTON 2% ELASTANE/98% COTTON 2% SPANDEX";
      case "CT95SP5":
        return "95% COTTON 5% SPANDEX";
      case "96CMCON4EL":
        return "96% MICRO MODAL 4% ELASTANE";
      case "MDL97EL3":
        return "97% MICRO MODAL 3% SPANDEX";
      case "100Polyest":
        return "100% POLYESTER";
      case "PE100":
        return "100% POLYESTER";
      case "49C36AC15V":
        return "49% COTTON 36% ACRYLIC 15% VISCOSE";
      case "55Ct+37+8%":
        return "CO 55 % CMD 37 % EL 8 %";
      case "100":
        return "100% COTTON";
      case "95Ctn5Elst":
        return "95% COTTON 5% ELASTANE";
      case "70CT30PEST":
        return "CKNA related one";
      case "100Supima":
        return "CKNA related one";
      case "CT57PO38S5":
        return "57% COTTON, 38% POLYESTER, 5% SPANDEX";
      case "CT95EL5":
        return "95% COTTON 5% ELASTANE";
      case "CT60PLY40":
        return "60% COTTON 40% POLYESTER";
      case "CT60EST40":
        return "60% COTTON 40% POLYESTER";
      case "60BC40PET":
        return "60% COTTON 40% POLYESTER";
      case "96MODAL4S":
        return "96% MICRO MODAL 4% ELASTANE";
      case "58CT39RECY":
        return "CO 58 % RPE 39 % EL 3 %";
      case "57CT38PEST":
        return "57% COTTON, 38% POLYESTER, 5% ELASTANE";
      case "78CT22SE":
        return "78% NYLON 22% ELASTANE";
      case "74BCICTN21":
        return "74% BCI COTTON  21% RECYLED COTTON 5% ELASTANE";
      case "78CT22SPA":
        return "78%POLYESTER 22%SPANDEX";
      case "69BCI21RC1":
        return "69% BCI COTTON, 21% RECYCLED COTTON, 10% LOWSET ELASTANE";
      case "78CN22SCL":
        return "78% COTTON, 22% SEA CELL";
      case "57%CT38%":
        return "57% COTTON, 38% POLYESTER, 5% ELASTANE";
      case "69BCICT21E":
        return "69% BCI COTTON, 21% RECYCLED COTTON, 10% LOWSET ELASTANE";
      case "CT96EL4":
        return "CO 96 % EL 4 %";
      case "57CTN38P5E":
        return "57% COTTON, 38% POLYESTER, 5% ELASTANE";
      case "69CTN21REC":
        return "69% BCI COTTON, 21% RECYCLED COTTON, 10% LOWSET ELASTANE";
      case "CT65PLY35":
        return "CKNA related one";
      case "CT98SP2":
        return "CO 98 % EL 2 %/98% COTTON 2% ELASTANE/98% COTTON 2% SPANDEX";
      case "98CT2SPND":
        return "CO 98 % EL 2 %/98% COTTON 2% ELASTANE/98% COTTON 2% SPANDEX";
      case "92CTN8PTR":
        return "CKNA related one";
      case "CT92EL8":
        return "CKNA related one";
      case "92CT8PEST":
        return "CKNA related one";
      case "PO100":
        return "PES 100 %";
      case "CT100SESU":
        return "100% COTTON";
      case "96MCRM4SPN":
        return "96% MICRO MODAL 4% ELASTANE";
      case "79NYL21ELS":
        return "79%POLYESTER21%ELASTANE";
      case "57CT38RP5S":
        return "57% COTTON, 38% POLYESTER, 5% ELASTANE";
      case "57BC38CT5E":
        return "57% COTTON, 38% POLYESTER, 5% ELASTANE";
      case "79NY21EL":
        return "79%POLYESTER21%ELASTANE";
      case "55CO37MO":
        return "CO 55 % CMD 37 % EL 8 %";
      case "97CTN3ELS":
        return "97% COTTON, 3% ELASTANE";
      case "55CT37MOD8":
        return "CO 55 % CMD 37 % EL 8 %";
      case "MDL65PLY35":
        return "CKNA related one";
      case "95BCICO5EL":
        return "95% COTTON 5% ELASTANE";
      case "87CN13ET":
        return "87% COTTON, 13% ELASTANE";
      case "74CT24RC2S":
        return "CO 74 % RCO 24 % EL 2 %";
      case "CT58RY39S3":
        return "CO 58 % RPE 39 % EL 3 %";
      case "85MOD9CA6":
        return "CMD 85 % WS 9 % EL 6 %";
      case "POLY75NY25":
        return "PES 75 % PA 25%";
      case "85%SI9%Ca6":
        return "CMD 85 % WS 9 % EL 6 %";
      case "SC95EL5":
        return "95% COTTON 5% ELASTANE";
      case "97MCMO3SPN":
        return "CMD 97 % EL 3 %";
      case "95CTN5SPX":
        return "95% COTTON 5% SPANDEX";
      case "96ORGCT4ES":
        return "CO 96 % EL 4 %";
      case "57CO38RE5":
        return "57% COTTON, 38% POLYESTER, 5% ELASTANE";
      case "CT95SP5A":
        return "95% COTTON 5% SPANDEX";
      case "57CT38EST5":
        return "57% COTTON, 38% POLYESTER, 5% ELASTANE";
      case "57CO36PO5S":
        return "57% COTTON, 38% POLYESTER, 5% ELASTANE";
      case "PO55CT37":
        return "CO 55 % EL 8 % CMD 37 %";
      case "100CMPCT":
        return "100% COTTON";
      case "60CT40PLY":
        return "60% COTTON 40% POLYESTER";
      case "100BCICTTN":
        return "100% COTTON";
      case "100TENCEL":
        return "100% LYOCELL";
      case "74PET21T5E":
        return "74% BCI COTTON  21% RECYLED COTTON 5% ELASTANE";
      case "96%CT4%EL":
        return "CO 96 % EL 4 %";
      case "93ORCTN7EL":
        return "OCO 93 % EL 7 %";
      case "93BCICT7EL":
        return "OCO 93 % EL 7 %";
      case "TE100":
        return "100% LYOCELL";
      case "87PIM13LYC":
        return "87% PIMA COTTON, 13% LYCR";
      case "74CT24RT2E":
        return "CO 74 % RCO 24 % EL 2 %";
      case "CT93ELS7":
        return "93% COTTON 7% ELASTANE";
      case "100PEST":
        return "100% POLYESTER";
      case "100BCICMCT":
        return "CKNA related one";
      case "98BCICT2SP":
        return "CO 98 % EL 2 %/98% COTTON 2% ELASTANE/98% COTTON 2% SPANDEX";
      case "TestFabric":
        return "TestFabric";
      default:
        return value;
    }
  }
  
}
