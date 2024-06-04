/* global d3, topojson */
/* eslint-disable max-len */

// eslint-disable-next-line no-unused-consts
const projectName = "choroplethMap";

// originally coded by @paycoguy & @ChristianPaul (github) and modified by @shaharm1348 for freeCodeCamp .

// Define body
const body = d3.select("body");

const svg = d3.select("svg");

// Define the div for the tooltip
const tooltip = body
  .append("div")
  .attr("class", "tooltip")
  .attr("id", "tooltip")
  .style("opacity", 0);

// Define path, geoPath function and path constiable convert GeoJSON data into SVG path strings that can be rendered on the map
const path = d3.geoPath();
// scale percentages of educated population to 600 - 860 range. Why this range? and why round?
const x = d3.scaleLinear().domain([2.6, 75.1]).rangeRound([600, 860]);
// Define color constiable for both the legend and the map itself, 7 shades of green.

// create a g element for legends
const g = svg
  .append("g")
  .attr("class", "key")
  .attr("id", "legend")
  .attr("transform", "translate(0,40)");

// get the url for eduaction information file:
const EDUCATION_FILE =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/for_user_education.json";
// get the url for county data file:
const COUNTY_FILE =
  "https://cdn.freecodecamp.org/testable-projects-fcc/data/choropleth_map/counties.json";

Promise.all([d3.json(COUNTY_FILE), d3.json(EDUCATION_FILE)])
  .then((data) => {
    console.log(data);
    ready(data[0], data[1]);
  })
  .catch((err) => console.log(err));
const ready = (us, education) => {
  const educationValues = education.map((d) => d.bachelorsOrHigher);
  const minValue = Math.min(...educationValues);
  const maxValue = Math.max(...educationValues);
  // console.log(minValue, maxValue);
  const colorScale = d3
    .scaleSequential(d3.interpolateBlues)
    .domain([minValue, maxValue]); // d3.interpolateViridis minValue, maxValue);

  const counties = svg
    .selectAll(".county")
    .data(topojson.feature(us, us.objects.counties).features);
  const ticks = colorScale.ticks();
  const [domainStart, domainEnd] = colorScale.domain();
  // set colors and other attributes of legend axis
  g.selectAll("rect")
    .data(
      ticks.map((t, i, n) => {
        const start = i === 0 ? domainStart : n[i - 1];
        const end = i === n.length - 1 ? domainEnd : t;
        return [start, end];
      })
    )
    .enter()
    .append("rect")
    .attr("height", 10)
    .attr("x", (d) => x(d[0]))
    .attr("width", (d) => (d[0] && d[1] ? x(d[1]) - x(d[0]) : x(null)))
    .attr("fill", (d) => colorScale(d[0]));

  // set the x axis for legend
  g.call(
    d3
      .axisBottom(x)
      .tickSize(13)
      .tickFormat((x) => Math.round(x) + "%")
      .tickValues(colorScale.domain())
  )
    .select(".domain")
    .remove();

  counties
    .enter()
    .append("path")
    .attr("class", "county")
    .attr("data-fips", (d) => d.id)
    .attr("data-education", (d) => {
      const result = education.filter((obj) => obj.fips === d.id);
      if (result[0]) {
        return result[0].bachelorsOrHigher;
      }
      // could not find a matching fips id in the data
      console.log("could find data for: ", d.id);
      return 0;
    })
    .attr("fill", (d) => {
      const result = education.filter((obj) => obj.fips === d.id);
      if (result[0]) {
        return colorScale(result[0].bachelorsOrHigher);
      }
      // could not find a matching fips id in the data
      return colorScale(0);
    })
    .attr("d", path)
    .on("mouseover", (event, d) => {
      tooltip.style("opacity", 0.9);
      tooltip
        .html(() => {
          const result = education.filter((obj) => obj.fips === d.id);
          if (result[0]) {
            return (
              result[0]["area_name"] +
              ", " +
              result[0]["state"] +
              ": " +
              result[0].bachelorsOrHigher +
              "%"
            );
          }
          // could not find a matching fips id in the data
          return 0;
        })
        .attr("data-education", () => {
          const result = education.filter((obj) => obj.fips === d.id);
          if (result[0]) {
            return result[0].bachelorsOrHigher;
          }
          // could not find a matching fips id in the data
          return 0;
        })
        .style("left", event.pageX + 10 + "px")
        .style("top", event.pageY - 28 + "px");
    })
    .on("mouseout", () => tooltip.style("opacity", 0));
  counties.exit().remove();

  svg
    .append("path")
    .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
    .attr("class", "states")
    .attr("d", path);
};
