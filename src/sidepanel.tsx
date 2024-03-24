import { render } from "preact";
import React from "preact/compat";
import Activities from "./components/Activities";

const SidePanel = (
  <div>
    <h1>Side panel</h1>
    <Activities />
  </div>
);

render(SidePanel, document.body);
