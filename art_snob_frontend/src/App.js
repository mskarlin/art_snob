import React, { useState } from 'react';
// import logo from './logo.svg';
import living_room from './living_room.jpg';
import './sidebar.scss';
import './App.css';
import { makeStyles } from '@material-ui/core/styles';
import GridList from '@material-ui/core/GridList';
import GridListTile from '@material-ui/core/GridListTile';
import GridListTileBar from '@material-ui/core/GridListTileBar';
import ListSubheader from '@material-ui/core/ListSubheader';
import IconButton from '@material-ui/core/IconButton';
import InfoIcon from '@material-ui/icons/Info';
import Sidebar from "react-sidebar";
import { Frame, Stack } from "framer";

import { random, floor } from 'mathjs';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    overflow: 'hidden',
    backgroundColor: theme.palette.background.paper,
  },
  gridList: {
    width: "200px",
    height: "auto",
  },
  icon: {
    color: 'rgba(255, 255, 255, 0.54)',
  },
}));

// set up for testing
function createTiles(base, times) {
  let tiles = [];
	for(let i = 0; i < times; i++) {
    let newbase = JSON.parse(JSON.stringify(base))
    newbase.cols = floor(random(1, 4))
    newbase.key = i
    console.log(newbase)
  	tiles.push(newbase)
  }
  return tiles;
}


let base = {
  img: "https://storage.googleapis.com/artsnob-image-scrape/full/0031187292e628b88309d96256259be4d49ebed8.jpg",
  key: 0,
  title: 'Image',
  author: 'author',
  cols: 1,
}

// const tileData = createTiles(base, 5)

// function ImageGridList() {
//   const classes = useStyles();

//   return (
//     <div className={classes.root}>
//       <GridList cellHeight={180} cols={1} className={classes.gridList}>
//         <GridListTile key="Subheader" cols={1} style={{ height: 'auto' }}>
//           <ListSubheader component="div">December</ListSubheader>
//         </GridListTile>
//         {tileData.map((tile) => (
//           <GridListTile key={tile.key}>
//             <img src={tile.img} alt={tile.title} cols={1} />
//             <GridListTileBar
//               title={tile.title}
//               subtitle={<span>by: {tile.author}</span>}
//               actionIcon={
//                 <IconButton aria-label={`info about ${tile.title}`} className={classes.icon}>
//                   <InfoIcon />
//                 </IconButton>
//               }
//             />
//           </GridListTile>
//         ))}
//       </GridList>
//     </div>
//   );
// }

function App() {
  const [landingState, setLandingState] = useState({"open": true});
  
  var mainPage = {
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    backgroundColor: "#ffffff"
  }

  if (landingState.open) {
  return (
    <div className="App">
      <main>
          <Frame style={mainPage}>
          <LandingPage landingState={landingState} setLandingState={setLandingState}></LandingPage>
          <MainHeader></MainHeader>
          </Frame>
      </main>
    </div>
  )
  }
  return (
    <div className="App">
      <main>
          <LandingPage landingState={landingState} setLandingState={setLandingState}></LandingPage>
          <MainHeader></MainHeader>
      </main>
    </div>
  )

}



function LandingPage(props) {

  var landingModalOver = {
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    backgroundColor: "rgba(33, 37, 41, 0.98)",
  }
  
  function loadLandingPage() {
    if (props.landingState.open) {
      landingModalOver['display'] = 'block'
      return landingModalOver
    }
    else {
      landingModalOver['display'] = 'none'
      return landingModalOver
    }}
  
  return (
      <Frame style={loadLandingPage()}>
      <WelcomeMessage startFunc={props.setLandingState}></WelcomeMessage>
      </Frame>
  )

}

function WelcomeMessage({startFunc}) {
  const firstLine = {
    width: 327,
    height: 50,
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    overflow: "hidden",
  }
  const welcomeMessage = {
    width: "100vw",
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  }
return (
        <Stack style={welcomeMessage}>
          <div style={firstLine}>
            <div className="welcome-to">Welcome to  </div>
            <div className="magic-lattice-art">Magic Lattice Art</div>
          </div>
          <div className="centerline">The room-centric art finder to complete your home.</div>
          <div className="cookiesnote">Note that we use cookies to store your info between sessions.</div>
          <button variant="primary" onClick={() => startFunc({"open": false})}>Get Started!</button>
        </Stack>
      )

}

function MainHeader() {

  const header = {
    boxSizing: "border-box",
    width: "100vw",
    height: 78,
    overflow: "hidden",
    backgroundColor: "white",
    borderStyle: "solid",
    borderColor: "#222",
    borderTopWidth: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 0,
    borderRightWidth: 0,
  }

  const headerStack = {
    boxSizing: "border-box",
    width: "100vw",
    height: 78,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    overflow: "visible",
  }

  return (
    <div style={header}>
      <div style={headerStack}>
      <div className="magic-lattice-header">Domistyle</div>
      <span className="material-icons md-36">menu</span>
      </div>
    </div>
  )
}



export default App;
