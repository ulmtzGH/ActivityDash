import { ChangeDetectionStrategy, Component, inject, computed, ViewChild, ElementRef, AfterViewInit, effect } from '@angular/core';
import { DataService } from '../../services/data.service';

// Inform TypeScript about the global d3 object
declare var d3: any;

interface ChartData {
  name: string;
  value: number;
}

interface TimeSeriesData {
  date: string;
  count: number;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements AfterViewInit {
  dataService = inject(DataService);

  @ViewChild('activityPieChart') private pieChartContainer!: ElementRef;
  @ViewChild('recentActivityBarChart') private barChartContainer!: ElementRef;

  // Computed signal for activity distribution
  activityDistribution = computed(() => {
    const logs = this.dataService.activityLogs();
    const distribution = new Map<string, number>();

    for (const log of logs) {
      const activityName = this.dataService.getActivityById(log.activityId)?.name || 'Desconocida';
      distribution.set(activityName, (distribution.get(activityName) || 0) + 1);
    }
    
    return Array.from(distribution.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  });

  // Computed signal for recent activity
  recentActivity = computed(() => {
    const logs = this.dataService.activityLogs();
    const last7Days = new Map<string, number>();

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      last7Days.set(dateString, 0);
    }

    for (const log of logs) {
      if (last7Days.has(log.date)) {
        last7Days.set(log.date, (last7Days.get(log.date) || 0) + 1);
      }
    }
    
    return Array.from(last7Days.entries()).map(([date, count]) => ({ date, count }));
  });

  constructor() {
    // Redraw charts whenever the underlying data changes
    effect(() => {
      if (this.pieChartContainer && this.barChartContainer) {
          this.drawCharts();
      }
    });
  }

  ngAfterViewInit() {
    this.drawCharts();
  }
  
  private drawCharts() {
    this.createPieChart(this.activityDistribution());
    this.createBarChart(this.recentActivity());
  }

  private createPieChart(data: ChartData[]): void {
    if (!this.pieChartContainer || !data || data.length === 0) return;

    const element = this.pieChartContainer.nativeElement;
    d3.select(element).select('svg').remove();

    const width = element.offsetWidth;
    const height = element.offsetHeight;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select(element).append('svg')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    // FIX: Removed type argument from d3.pie() call as d3 is not strongly typed here,
    // which caused a compile error. Also explicitly typed the argument for the .value() accessor for clarity.
    const pie = d3.pie().value((d: ChartData) => d.value).sort(null);
    const arc = d3.arc().innerRadius(radius * 0.5).outerRadius(radius);

    const tooltip = d3.select('body').append('div')
      .attr('class', 'd3-tooltip absolute p-2 text-xs bg-gray-900 text-white rounded-md pointer-events-none opacity-0 transition-opacity duration-200')
      .style('z-index', '10');

    const path = svg.selectAll('path')
      .data(pie(data))
      .enter().append('path')
      .attr('d', arc)
      .attr('fill', (d: any) => color(d.data.name))
      .style('cursor', 'pointer')
      .on('mouseover', (event: any, d: any) => {
        tooltip.transition().style('opacity', .9);
        tooltip.html(`<strong>${d.data.name}</strong><br/>${d.data.value} registro(s)`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 20) + 'px');
        d3.select(event.currentTarget).transition().duration(200).attr('opacity', 0.7);
      })
      .on('mouseout', (event: any) => {
        tooltip.transition().style('opacity', 0);
        d3.select(event.currentTarget).transition().duration(200).attr('opacity', 1);
      });
  }

  private createBarChart(data: TimeSeriesData[]): void {
    if (!this.barChartContainer || !data || data.length === 0) return;

    const element = this.barChartContainer.nativeElement;
    d3.select(element).select('svg').remove();

    const margin = { top: 20, right: 20, bottom: 50, left: 40 };
    const width = element.offsetWidth - margin.left - margin.right;
    const height = element.offsetHeight - margin.top - margin.bottom;

    const svg = d3.select(element).append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .range([0, width])
      .domain(data.map(d => new Date(d.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })))
      .padding(0.3);

    const y = d3.scaleLinear()
      .range([height, 0])
      .domain([0, d3.max(data, (d: any) => d.count) * 1.2 || 10]);

    const tooltip = d3.select('body').append('div')
      .attr('class', 'd3-tooltip absolute p-2 text-xs bg-gray-900 text-white rounded-md pointer-events-none opacity-0 transition-opacity duration-200')
      .style('z-index', '10');
      
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('text-anchor', 'end')
      .attr('dx', '-.8em')
      .attr('dy', '.15em')
      .attr('transform', 'rotate(-40)');

    svg.append('g').call(d3.axisLeft(y).ticks(5).tickFormat(d3.format('d')));

    svg.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar fill-primary-500 hover:fill-primary-700 transition-colors')
      .attr('x', (d: any) => x(new Date(d.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })))
      .attr('width', x.bandwidth())
      .attr('y', height)
      .attr('height', 0)
      .style('cursor', 'pointer')
      .on('mouseover', (event: any, d: any) => {
        tooltip.transition().style('opacity', .9);
        tooltip.html(`<strong>${new Date(d.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</strong><br/>${d.count} registro(s)`)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 20) + 'px');
      })
      .on('mouseout', () => {
        tooltip.transition().style('opacity', 0);
      })
      .transition()
      .duration(800)
      .attr('y', (d: any) => y(d.count))
      .attr('height', (d: any) => height - y(d.count));
  }
}