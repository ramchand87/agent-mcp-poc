import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { AppService } from './app.service';

@Controller('api')
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get('employees')
  getAllEmployees() {
    return this.appService.getAllEmployees();
  }

  @Get('employees/search')
  searchEmployeesByName(@Query('name') name: string) {
    if (!name) {
      return this.appService.getAllEmployees();
    }
    return this.appService.searchEmployeesByName(name);
  }

  @Get('employees/:id')
  getEmployeeById(@Param('id') id: string) {
    const employee = this.appService.getEmployeeById(id);
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
    return employee;
  }

  @Get('salary/:employeeId')
  getSalaryByEmployeeId(@Param('employeeId') employeeId: string) {
    const salary = this.appService.getSalaryByEmployeeId(employeeId);
    if (!salary) {
      throw new NotFoundException(`Salary record for employee ID ${employeeId} not found`);
    }
    return salary;
  }

  @Get('attendance/:employeeId')
  getAttendanceByEmployeeId(@Param('employeeId') employeeId: string) {
    const attendance = this.appService.getAttendanceByEmployeeId(employeeId);
    if (!attendance) {
      throw new NotFoundException(`Attendance record for employee ID ${employeeId} not found`);
    }
    return attendance;
  }
}
