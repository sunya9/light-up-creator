import { Route, Switch, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { Editor } from "./pages/Editor";
import { Importer } from "./pages/Importer";
import { Player } from "./pages/Player";

function App() {
  return (
    <Router hook={useHashLocation}>
      <Switch>
        <Route path="/play/:hash">
          {(params) => <Player hash={params.hash} />}
        </Route>
        <Route path="/import/:hash" component={Importer} />
        <Route path="/edit/:id">
          {(params) => <Editor routeId={params.id} />}
        </Route>
        <Route path="/">
          <Editor />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
