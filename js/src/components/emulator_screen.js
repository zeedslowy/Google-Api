import withStyles from '@mui/styles/withStyles';

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Copyright from "./copyright";
import { Emulator } from "android-emulator-webrtc/emulator";
import LogcatView from "./logcat_view";
import ExitToApp from "@mui/icons-material/ExitToApp";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import ImageIcon from "@mui/icons-material/Image";
import OndemandVideoIcon from "@mui/icons-material/OndemandVideo";
import Slider from "@mui/material/Slider";
import VolumeDown from "@mui/icons-material/VolumeDown";
import VolumeUp from "@mui/icons-material/VolumeUp";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PropTypes from "prop-types";
import React from "react";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Snackbar from "@mui/material/Snackbar";
import Alert from '@mui/material/Alert';

const styles = (theme) => ({
  root: {
    flexGrow: 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  title: {
    flexGrow: 1,
  },
  nofocusborder: {
    outline: "none !important;",
  },
  paper: {
    marginTop: theme.spacing(4),
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
});

// We want a white slider, otherwise it will be invisible in the appbar.
const WhiteSlider = withStyles({
  thumb: {
    color: "white",
  },
  track: {
    color: "white",
  },
  rail: {
    color: "white",
  },
})(Slider);

// This class is responsible for hosting two emulator components next to each other:
// One the left it will display the emulator, and on the right it will display the
// active logcat.
//
// It uses the material-ui to display a toolbar.
class EmulatorScreen extends React.Component {
  state = {
    view: "webrtc",
    error_snack: false,
    error_msg: "",
    emuState: "connecting",
    muted: true,
    volume: 0.0,
    hasAudio: false,
    // Let's start at the Googleplex
    gps: { latitude: 37.4221, longitude: -122.0841 },
  };

  static propTypes = {
    uri: PropTypes.string, // grpc endpoint
    auth: PropTypes.object, // auth module to use.
  };

  stateChange = (s) => {
    this.setState({ emuState: s });
  };

  onAudioStateChange = (s) => {
    console.log("Received an audio state change from the emulator.");
    this.setState({ hasAudio: s });
  };

  onError = (err) => {
    this.setState({
      error_snack: true,
      error_msg: "Low level gRPC error: " + JSON.stringify(err),
    });
  };

  updateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((location) => {
        const loc = location.coords;
        this.setState({
          gps: { latitude: loc.latitude, longitude: loc.longitude },
        });
      });
    }
  };

  handleClose = (e) => {
    this.setState({ error_snack: false });
  };

  handleVolumeChange = (e, newVolume) => {
    const muted = newVolume === 0;
    this.setState({ volume: newVolume, muted: muted });
  };

  render() {
    const { uri, auth, classes } = this.props;
    const {
      view,
      emuState,
      error_snack,
      error_msg,
      muted,
      volume,
      hasAudio,
      gps,
    } = this.state;
    return (
      <div className={classes.root}>
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" className={classes.title}>
              Using emulator view: {view}
            </Typography>

            {hasAudio ? ( // Only display volume control if this emulator supports audio.
              <Box width={200} paddingTop={1}>
                <Grid container spacing={2}>
                  <Grid item>
                    <VolumeDown />
                  </Grid>
                  <Grid item xs>
                    <WhiteSlider
                      value={volume}
                      onChange={this.handleVolumeChange}
                      min={0.0}
                      max={1.0}
                      step={0.01}
                      aria-labelledby="continuous-slider"
                    />
                  </Grid>
                  <Grid item>
                    <VolumeUp />
                  </Grid>
                </Grid>
              </Box>
            ) : (
              // No audio track, so no volume slider.
              <div />
            )}

            <div className={classes.grow} />
            <div className={classes.sectionDesktop}>
              <IconButton
                aria-label="Get current location"
                color="inherit"
                onClick={this.updateLocation}
                size="large">
                <LocationOnIcon />
              </IconButton>
              <IconButton
                aria-label="Switch to webrtc"
                color="inherit"
                onClick={() => this.setState({ view: "webrtc" })}
                size="large">
                <OndemandVideoIcon />
              </IconButton>
              <IconButton
                aria-label="Switch to screenshots"
                color="inherit"
                onClick={() => this.setState({ view: "png" })}
                size="large">
                <ImageIcon />
              </IconButton>
              <IconButton
                edge="end"
                aria-label="logout"
                color="inherit"
                onClick={() => auth.logout()}
                size="large">
                <ExitToApp />
              </IconButton>
            </div>
          </Toolbar>
        </AppBar>

        <div className={classes.paper}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Container maxWidth="sm">
                <Emulator
                  uri={uri}
                  auth={auth}
                  view={this.state.view}
                  onStateChange={this.stateChange}
                  onAudioStateChange={this.onAudioStateChange}
                  onError={this.onError}
                  muted={muted}
                  volume={volume}
                  gps={gps}
                  width={200}
                  // For some reason, height was not defined. Maybe it was accidentally omitted? Omitting this property will cause the Emulator HTML element that displays the emulator screen not to render since only the width will be rendered.
                  // height={500}
                />
                <p>State: {emuState} </p>
              </Container>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LogcatView uri={uri} auth={auth} />
            </Grid>
          </Grid>
        </div>
        <Box mt={8}>
          <Copyright />
        </Box>
        <Snackbar open={error_snack} autoHideDuration={6000}>
          <Alert onClose={this.handleClose} severity="error">
            {error_msg}
          </Alert>
        </Snackbar>
      </div>
    );
  }
}

export default withStyles(styles)(EmulatorScreen);
