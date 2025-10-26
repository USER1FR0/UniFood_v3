import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './supervisor-dashboard.component.html',
  styleUrls: ['./supervisor-dashboard.component.scss']
})
export class SupervisorDashboardComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}

