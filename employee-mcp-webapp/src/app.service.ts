import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AppService {
  private readonly data: any;

  constructor() {
    const dataPath = path.join(__dirname, 'backend-data.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    this.data = JSON.parse(rawData);
  }

  getAllEmployees() {
    return this.data.employees;
  }

  getEmployeeById(id: string) {
    return this.data.employees.find((emp: any) => emp.id === id);
  }

  searchEmployeesByName(name: string) {
    const lowerName = name.toLowerCase();
    return this.data.employees.filter((emp: any) => emp.name.toLowerCase().includes(lowerName));
  }

  getSalaryByEmployeeId(employeeId: string) {
    return this.data.salaries.find((sal: any) => sal.employeeId === employeeId);
  }

  getAttendanceByEmployeeId(employeeId: string) {
    return this.data.attendance.find((att: any) => att.employeeId === employeeId);
  }
}
