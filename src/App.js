import React, { Component } from "react";
import "./App.css";

import "react-select/dist/react-select.css";
import "react-datepicker/dist/react-datepicker.css";

import Select from "react-select";
import { Line } from "react-chartjs";

import DatePicker from "react-datepicker";
import moment from "moment";
import regression from './regression';

const QUANDL_KEY = "CU5crF9_VkawsswoTN5y";
const SERVER_API = "https://vitamin-stock.mailo.ml";
const QUANDL_API = "https://www.quandl.com/api/v3";
const chartOptions = {
  responsive: true,
  title: {
    display: true,
    text: "Stock price "
  },
  scales: {
    xAxes: [
      {
        display: true,
        scaleLabel: {
          display: true,
          labelString: "Month"
        }
      }
    ],
    yAxes: [
      {
        display: true,
        scaleLabel: {
          display: true,
          labelString: "Value"
        }
      }
    ]
  }
};

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      business: {
        Name: "Apple Inc.",
        Symbol: "AAPL"
      },
      chart: {
        labels: [],
        datasets: [
          {
            label: "$",
            data: []
          }
        ]
      },

      startDate: moment().subtract(1, "month"),
      endDate: moment(),
      activeBtn: 2
    };
  }

  onChange(value) {
    this.setState(
      {
        business: value
      },
      this.getStock
    );
  }

  getUsers(input) {
    if (!input) {
      return Promise.resolve({
        options: []
      });
    }

    return fetch(`${SERVER_API}/symbol/${input}`)
      .then(response => response.json())
      .then(json => {
        return {
          options: json
        };
      });
  }

  componentWillMount() {
    this.getStock();
  }

predict(eq,x){
  let r = 0;
  if(eq){
    eq.forEach((d,i)=>{
//      console.log(i+"  "+d)
      r+=d*Math.pow(x,i);
    });
  }
  return r;
}

  addPrediction(days){
    var data = [];
    this.state.chart.datasets[0].data.forEach(function(d,i){
      data.push([i,d])
    })
    var result = regression('polynomial', data,3);

    let data_length = data.length;
    let latest_date = moment(this.state.chart.labels[data_length]);
    let copy_d = this.state.chart;
    for(let i=1;i<=days;i++){
      copy_d.labels.push(latest_date.add(i, 'days').format('YYYY-MM-DD'));
      copy_d.datasets[0].data.push(this.predict(result.equation,data_length+i-1))
      
    }
    console.log(data,result)
    this.setState({chart:copy_d});
  }

  getStock(
    business = this.state.business,
    interval = {
      start: this.state.startDate.format("YYYY-MM-DD"),
      end: this.state.endDate.format("YYYY-MM-DD")
    },
    daily = true,
    with_prediction = false
  ) {
    //https://www.quandl.com/api/v3/datasets/WIKI/FB.json?column_index=4&start_date=2014-01-01&end_date=2014-01-31&collapse=daily&api_key=CU5crF9_VkawsswoTN5y
    //console.log("Fetch stock for",business,this.state)
    let link = QUANDL_API;
    // if (with_prediction) {
    //   link = SERVER_API;
    // }

    return fetch(
      `${link}/datasets/WIKI/${this.state.business.Symbol}/data.json?column_index=4&start_date=${interval.start}&end_date=${interval.end}${daily ? "&collapse=daily" : ""}&api_key=${QUANDL_KEY}`
    )
      .then(response => response.json())
      .then(json => {
        // console.log(json)

        let chartData = [];
        let chartLabels = [];
        try {
          json.dataset_data.data.forEach(function(d, i) {
            chartLabels.push(d[0]);
            chartData.push(d[1]);
          });
        } catch (ex) {
          console.log("Exception populate chart table", ex);
        }
        //  console.log("chartData",chartData)
        //  console.log("chartLabels",chartLabels)
        this.setState({
          // quandlData:json,
          chart: {
            labels: chartLabels,
            datasets: [
              {
                label: "$",
                data: chartData
              }
            ]
          }
        });

          if(with_prediction){
              this.addPrediction(30);
          }
      });
  }

  handleChangeStartDate(date) {
    this.setState(
      {
        startDate: date
      },
      this.getStock
    );
  }
  handleChangeEndDate(date) {
    this.setState(
      {
        endDate: date
      },
      this.getStock
    );
  }

  activate30Days(e) {
    this.setState(
      {
        activeBtn:2,
        startDate: moment().subtract(1, "month"),
        endDate: moment()
      },
      () => {
        this.getStock(
          this.state.business,
          {
            start: this.state.startDate.format("YYYY-MM-DD"),
            end: this.state.endDate.format("YYYY-MM-DD")
          },
          false
        );
      }
    );
  }
  activate30DaysPlus(e) {
    this.setState(
      {
        activeBtn:3,
        startDate: moment().subtract(1, "month"),
        endDate: moment()
      },
      () => {
        this.getStock(
          this.state.business,
          {
            start: this.state.startDate.format("YYYY-MM-DD"),
            end: this.state.endDate.format("YYYY-MM-DD")
          },
          false,
          true
        );
      }
    );
  }
  render() {
    const AsyncComponent = Select.Async;

    return (
      <div className="App">
        <h1
          style={{
            textAlign: "center",
            width: "100%"
          }}
          id="title"
        >
          Stock predict
          {" "}
          {typeof this.state.business.Name !== "undefined"
            ? "for " + this.state.business.Name
            : ""}
          {" "}
        </h1> <div className="container">
          <h3> Please type the company name </h3>

          <AsyncComponent
            multi={false}
            value={this.state.business.Name}
            onChange={this.onChange.bind(this)}
            valueKey="Symbol"
            labelKey="Name"
            placeholder="Change business"
            loadOptions={this.getUsers}
            backspaceRemoves={true}
          />
          {" "}
          <div className="buttons-timestamp">
            {" "}
            {/*<button className={ this.state.activeBtn === 1 ? 'active ':'' }
                                      onClick={this.activate1Day.bind(this)}>1 day</button>*/}

            <button
              className={this.state.activeBtn === 2 ? "active " : ""}
              onClick={this.activate30Days.bind(this)}
            >
              {" "}30 days{" "}
            </button>

            <button
              className={this.state.activeBtn === 3 ? "active " : ""}
              onClick={this.activate30DaysPlus.bind(this)}
            >
              {" "}30 days + prediction{" "}
            </button>
            {" "}
          </div> <br />
          Between
          {" "}
          <DatePicker
            dateFormat="YYYY/MM/DD"
            selected={this.state.startDate}
            onChange={this.handleChangeStartDate.bind(this)}
          />
          {" "}
          <span
            style={{
              marginLeft: 4,
              marginRight: 4
            }}
          >
            {" "}and{" "}
          </span>
          {" "}
          <DatePicker
            dateFormat="YYYY/MM/DD"
            selected={this.state.endDate}
            onChange={this.handleChangeEndDate.bind(this)}
          />

          <Line
            style={{
              marginTop: "48px"
            }}
            data={this.state.chart}
            options={chartOptions}
            width="600"
            height="250"
            redraw
          />

        </div>{" "}
      </div>
    );
  }
}

export default App;
