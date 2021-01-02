import React, {Component, createContext, useReducer, useEffect} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { auth } from "./firebase.js";
import { useCookies } from 'react-cookie';


async function postData(url = '', data = {}, token=null) {
    // Default options are marked with *
    let myHeaders = {'Content-Type': 'application/json'}

    if (token) {
      myHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(process.env.REACT_APP_PROD_API_DOMAIN+url, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: myHeaders,
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(data) // body data type must match "Content-Type" header
    });

    return response.json(); // parses JSON response into native JavaScript objects
  }
  
    // .then(data => {
    //   console.log(data); // JSON data parsed by `data.json()` call
    // });

  String.prototype.hashCode = function(){
      var hash = 0;
      for (var i = 0; i < this.length; i++) {
          var character = this.charCodeAt(i);
          hash = ((hash<<5)-hash)+character;
          hash = hash & hash; // Convert to 32bit integer
      }
      return hash;
  }

export async function logIn(email, sessionId, state, dispatch, token) {
  // get the session back if it exists, and writes session if no session exists
  if (!email) return;

  const maybeSession = await postData('/sessionlogin/',
    {hashkey: email.hashCode().toString(), sessionId: sessionId.toString()},
    token)

  if (maybeSession) {
      // return if auth failed
      if ('detail' in maybeSession) {
        return;
      }
      else{
        dispatch({type: 'TOGGLE_LOG_STATE', state: true})
      }
    // console.log('Pulled session', maybeSession.sessionId);
    dispatch({type: 'ASSIGN_STATE', state: maybeSession})
  }
  else{
    dispatch({type: 'TOGGLE_LOG_STATE', state: true})
    postData('/state/', state, token)
  }
    
  return maybeSession
}

// todo: write a session ID to the cookies, and write the state every so often? maybe every update??
// todo: then that way for logins or whatever, we could just load the state? 
const initialFeed = [{name: '', images: '', id: null}, {name: '', images: '', id: null}, {name: '', images: '', id: null}, {name: '', images: '', id: null},
{name: '', images: '', id: null}, {name: '', images: '', id: null}, {name: '', images: '', id: null}, {name: '', images: '', id: null}, {name: '', images: '', id: null},                     
{name: '', images: '', id: null}]

const blankRoom= {reload: true, feed: initialFeed, feedCursor: null, roomType: 'blank', 'name': 'My new room', 'showingMenu': false, art: [{id:1, size: 'medium', artId: null}], arrangement: {rows:1}, arrangementSize: 1, clusterData:{likes:[], dislikes:[], skipped:[], skipN:0, startN:0, nActions:0}, vibes: [], 'seedTags': [], 'seedArt': []}


export const initialState = {
    'landingState': {'open': true},
    'sessionId': uuidv4(),
    'potentialArt': null,
    'blankRoom': blankRoom,
    'artBrowseSeed': null, 
    'loggedIn': false,
    'purchaseList': null,
    'vibeSelect': false,
    'searchTagSet': '',
    'searchTagNames': [],
    'likedArt': [],
    'recommendationApprovals': {approvals: [], disapprovals: []},
    'priceRange': {'p_xsmall': {'price': '$40-60', 'name': 'Extra Small', 'sizeDesc': '12" x 14"', artSize: [12, 14], 'priceTextSize': '10px'},
                        'l_xsmall': {'price':'$40-60', 'name': 'Extra Small', 'sizeDesc': '14" x 12"', artSize: [14, 12], 'priceTextSize': '10px'},
                        'xsmall': {'price': '$40-60', 'name': 'Extra Small', 'sizeDesc': '14" x 14"', artSize: [14, 14], 'priceTextSize': '10px'},
                        'p_small': {'price': '$50-70', 'name': 'Small', 'sizeDesc': '17" x 23"', artSize: [17, 23], 'priceTextSize': '11px'},
                        'l_small': {'price': '$50-70', 'name': 'Small', 'sizeDesc': '23" x 17"', artSize: [23, 17], 'priceTextSize': '11px'},
                        'p_medium': {'price': '$70-90', 'name': 'Medium', 'sizeDesc': '22" x 28"', artSize: [22, 28], 'priceTextSize': '12px'},
                        'l_medium': {'price': '$70-90', 'name': 'Medium', 'sizeDesc': '28" x 22"', artSize: [28, 22], 'priceTextSize': '12px'},
                        'medium': {'price': '$80-115', 'name': 'Medium', 'sizeDesc': '24" x 24"', artSize: [24, 24], 'priceTextSize': '12px'},
                        'p_large': {'price': '$150-200', 'name': 'Large', 'sizeDesc': '28" x 40"', artSize: [28, 40], 'priceTextSize': '14px'},
                        'l_large': {'price': '$150-200', 'name': 'Large', 'sizeDesc': '40" x 28"', artSize: [40, 28], 'priceTextSize': '14px'}
  },
    'newRoomShow': {show: true, currentName: 'My new room', selectionRoom: blankRoom},
    'rooms': []
};

const localState = JSON.parse(localStorage.getItem("deco-state"));

const store = createContext(initialState);
const { Provider } = store;

const StateProvider = ( { children } ) => {
  
  const [cookies, setCookie, removeCookie] = useCookies(['fbToken']);

  const [state, dispatch] = useReducer(
      (state, action) => {
    // console.log('StateProvider:ACTION', action)
    // console.log('StateProvider:STATE', state)
    let newState={}
    switch(action.type){
      case 'ASSIGN_STATE':
        // need to fill in some non-backend stored state variables, fill with the blank room stuff
        const addedRooms = action.state.rooms.map(r => {return {...blankRoom, name: r.name, roomType: r.roomType, 
          art: r.art, arrangement: r.arrangement, arrangementSize: r.arrangementSize, clusterData: r.clusterData, 
          id: r.id
        }})
        return {...state, sessionId: action.state.sessionId, 
            likedArt: action.state.likedArt, rooms: addedRooms,
          newRoomShow: {...state.newRoomShow, show: false}}
      case 'TOGGLE_LOG_STATE':
        return {...state, loggedIn: action.state}
      case 'ADD_ROOM':
        if (state.rooms.map(r=>r.id).includes(action.room.id)) {
            newState = {...state, 
              newRoomShow: {...state.newRoomShow, show: false},
              rooms: state.rooms.map(r => {
                
                if (r.id === action.room.id) {
                    return action.room
                }
                else {
                    return r
                }

            })}
            if (state.loggedIn){
              postData('/state/', newState, cookies.fbToken)
            }
            
            return newState
        }
        else {
            newState={...state, 
              newRoomShow: {...state.newRoomShow, show: false}, 
            rooms: state.rooms.concat({...action.room, name: action.room.name + ' ' +(state.rooms.length+1).toString()})}
            if (state.loggedIn){
              postData('/state/', newState, cookies.fbToken)
            }
            return newState
        }
      case 'DELETE_ROOM':
        if (state.rooms.map(r=>r.id).includes(action.room.id)) {
          newState = {...state, 
            newRoomShow: {currentName: '', selectionRoom: state.blankRoom, show: state.newRoomShow.show},
            rooms: state.rooms.filter(r => r.id !== action.room.id)}
          if (state.loggedIn){
            postData('/state/', newState, cookies.fbToken)
          }
          return newState
        }
        else {
          return state
          }
      case 'CLUSTER_LIKE':
        if (state.newRoomShow.selectionRoom.clusterData.likes.includes(action.like)) {
          return state
      }
      else {
          return {...state, newRoomShow: {...state.newRoomShow, 
            selectionRoom: {...state.newRoomShow.selectionRoom, 
              clusterData: {...state.newRoomShow.selectionRoom.clusterData, 
                skipN: 0, 
                startN: 0,
                nActions: state.newRoomShow.selectionRoom.clusterData.nActions + 1,
                likes: state.newRoomShow.selectionRoom.clusterData.likes.concat(action.like)}}}}
      }
      case 'CLUSTER_DISLIKE':
        if (state.newRoomShow.selectionRoom.clusterData.dislikes.includes(action.dislike)) {
          return state
      }
      else {
          return {...state, newRoomShow: {...state.newRoomShow, 
            selectionRoom: {...state.newRoomShow.selectionRoom, 
              clusterData: {...state.newRoomShow.selectionRoom.clusterData, 
                skipN: 0, 
                startN: 0,
                nActions: state.newRoomShow.selectionRoom.clusterData.nActions + 1,
                dislikes: state.newRoomShow.selectionRoom.clusterData.dislikes.concat(action.dislike)}}}}
      }
      case 'CLUSTER_SKIP':
        const currentSkip = state.newRoomShow.selectionRoom.clusterData.skipN
        return {...state, newRoomShow: {...state.newRoomShow, 
          selectionRoom: {...state.newRoomShow.selectionRoom, 
            clusterData: {...state.newRoomShow.selectionRoom.clusterData, 
              skipN: currentSkip+1,
              skipped: state.newRoomShow.selectionRoom.clusterData.skipped.concat(action.skipped),
              nActions: state.newRoomShow.selectionRoom.clusterData.nActions + 1
            }}}}

      case 'CLUSTER_MORE':
          const currentStart = state.newRoomShow.selectionRoom.clusterData.startN
          return {...state, newRoomShow: {...state.newRoomShow, 
            selectionRoom: {...state.newRoomShow.selectionRoom, 
              clusterData: {...state.newRoomShow.selectionRoom.clusterData, 
                startN: currentStart+1
              }}}}
      
      case 'ADD_FEED_IMAGES':
        let unfilledFeed = state.artBrowseSeed.feed.filter(x=> x.id === null)
        if (unfilledFeed.length > 0) {
          return {...state, artBrowseSeed: {...state.artBrowseSeed, feed: action.images, feedCursor: action.cursor}}
        }
        else{
          return {...state, artBrowseSeed: {...state.artBrowseSeed, feed: state.artBrowseSeed.feed.concat(action.images), feedCursor: action.cursor}}
        }
      case 'CLEAR_FEED_IMAGES':
          return {...state, artBrowseSeed: {...state.artBrowseSeed, feed: initialFeed, feedCursor: null}}
      
      case 'RELOAD_FEED':
          return {...state, artBrowseSeed: {...state.artBrowseSeed, reload: action.reload}}
      
      case 'TOGGLE_VIBE_SELECT':
        return {...state, vibeSelect: !state.vibeSelect}

      case 'ADD_VIBE':
      // add vibes to the pending (or current) room selection
        return {...state, newRoomShow: {...state.newRoomShow, 
          selectionRoom: {...state.newRoomShow.selectionRoom, 
            clusterData: {...state.newRoomShow.selectionRoom.clusterData, 
              skipN: 0, 
              startN: 0,
              likes: action.vibe.Clusters}}}}
    
      case 'TOGGLE_SEED_TAG':
        if (state.newRoomShow.selectionRoom.seedTags.includes(action.seedTag)) {
            const removedTag = state.newRoomShow.selectionRoom.seedTags.filter(t => t !== action.seedTag)
            return {...state, newRoomShow: {...state.newRoomShow, selectionRoom: {...state.newRoomShow.selectionRoom, seedTags: removedTag}}}
        }
        else {
            return {...state, newRoomShow: {...state.newRoomShow, selectionRoom: {...state.newRoomShow.selectionRoom, seedTags: state.newRoomShow.selectionRoom.seedTags.concat(action.seedTag)}}}
        }
      case 'TOGGLE_SEED_ART':
            if (state.newRoomShow.selectionRoom.seedArt.map(a => a.artId).includes(action.seedArt.artId)) {
                const removedArt = state.newRoomShow.selectionRoom.seedArt.filter(t => t.artId !== action.seedArt.artId)
                return {...state, newRoomShow: {...state.newRoomShow, selectionRoom: {...state.newRoomShow.selectionRoom, seedArt: removedArt}}}
            }
            else {
                return {...state, newRoomShow: {...state.newRoomShow, selectionRoom: {...state.newRoomShow.selectionRoom, seedArt: state.newRoomShow.selectionRoom.seedArt.concat(action.seedArt)}}}
            }
      case 'TOGGLE_LANDING':
        return {...state, landingState: {'open': !state.landingState.open}}
      case 'TOGGLE_NEW_ROOM_SHOW':
        // also clear the state so there's no hanging newRoomShow potential room
        return {...state, newRoomShow: {...state.newRoomShow, show: action.show}}
      case 'ASSIGN_NEW_ROOM_SHOW':
        return {...state, newRoomShow: action.newRoomShow}
      case 'POTENTIAL_ART':
        return {...state, potentialArt: action.artData}
      case 'RECOMMENDATION_APPROVAL':
        
      let approval = action.approval ? 'reco_approve' : 'reco_disapprove'

        postData('/actions/', { session: state.sessionId, action: approval, item: action.art.artId})

        if (action.approval) {
          newState = {...state, recommendationApprovals: {...state.recommendationApprovals, 
            approvals: state.recommendationApprovals.approvals.concat(action.art.artId)}}
        }
        else {
          newState = {...state, recommendationApprovals: {...state.recommendationApprovals, 
            disapprovals: state.recommendationApprovals.approvals.concat(action.art.artId)}}
        }

        if (state.loggedIn){
          postData('/state/', newState, cookies.fbToken)
        }

        return newState
      case 'LIKE_ART':
        postData('/actions/', { session: state.sessionId, action: 'liked', item: action.art.artId})
        let tmpArt = action.art
        tmpArt['id'] = action.art.artId
        newState = {...state, likedArt: state.likedArt.concat(tmpArt)}
        if (state.loggedIn){
          postData('/state/', newState, cookies.fbToken)
        }
        return newState
      case 'PURCHASE_LIST':
          return {...state, purchaseList: action.purchaseList}
      case 'ART_BROWSE_SEED':
        // artBrowseSeed should be a seed for a single room
        // vibes (per vibe), tags (separate?) and works of art (combined?) get their own carousals
        // right now, the order should be art->vibe->tag but this ranking can be optimized too
        // each exposure combo can be written to the backend where we get a chance to rank it
        // could also take the features for the art, and rank by those (on the front-end...)

        return {...state, artBrowseSeed: action.artBrowseSeed}
      case 'CHANGE_SEARCH_TAG_SET':
          return {...state, searchTagSet: action.searchTagSet, searchTagNames: action.searchTagNames}
      case 'CHANGE_MENU':
        // filter for arrangement in the room equal to action.id
        return {...state, 'rooms': state.rooms.map((room, _) => {
          const {id} = room
          if (id === action.id) {
            // TODO: add validation that the art exists for this
              return {...room, 
                showingMenu: action.menu
              }
          }
          else{
            return room
          }
        })}
      case 'CLOSE_ALL_MENUS':
        return {...state, 'rooms': state.rooms.map((room, _) => {
                return {...room, 
                  showingMenu: false
                }
          })}    
      case 'ADD_ARRANGEMENT':
        const popArt =  JSON.parse(JSON.stringify(state.newRoomShow.selectionRoom.art));
        const artRenumbered = action.art.map((a, _) => {
            if (a.artId !== 'NULLFRAME') {
              
              let loopArt = popArt.shift()
              let sPopArt = {}
              
              loopArt = (loopArt === undefined) ? {} : loopArt

              if ('size_price_list' in loopArt) {
                  if (loopArt.size_price_list.map(x=>x.type.trim()).includes(a.size)){
                    sPopArt = {...loopArt, id: a.id, size: a.size}
                  }
                  else {
                    sPopArt = a
                  }
              }
              else{
                sPopArt = {id: a.id, size: a.size}
              }
              
              if (!('artId' in sPopArt)) {
                sPopArt['artId'] = a.artId
              }
              return sPopArt
            }
            else {
              return a
            }
          })
        // filter for arrangement in the room equal to action.id
        newState={...state, newRoomShow: {...state.newRoomShow, 
            selectionRoom: {...state.newRoomShow.selectionRoom, 
                arrangement: action.arrangement,
                arrangementSize: action.arrangementSize,
                art: artRenumbered
                }},
              rooms: state.rooms.map(r => {
                if (r.id === action.id) {
                    return {...r, 
                      art: artRenumbered, arrangement: action.arrangement, arrangementSize: action.arrangementSize, showingMenu: action.showingMenu}
                }
                else {
                    return r
                }

              })
              }
        if (state.loggedIn){
          postData('/state/', newState, cookies.fbToken)
        }
        return newState
      case 'ADD_ROOMTYPE':
        // TODO: this implementatino is bugged... need to include whole state in return
        return state.rooms.map((room, _) => {
          const {id} = room
          if (id === action.id) {
            return {...room, room_type: action.room_type}
          }
          else{
            return room
          }
        })
      case 'ADD_ART':
        postData('/actions/', { session: state.sessionId, action: 'addtoroom:'+action.roomId, item: action.artId})
        newState = {...state, rooms: state.rooms.map((room, _) => {
          const {id} = room
          if (id === action.roomId) {
              const updatedArtwork = room.art.map((work, _) => {
              if (work.id === action.roomArtId) {
                return {...work, 
                          artId: action.artId,
                          page_url: action.page_url,
                          standard_tags: action.standard_tags,
                          name: action.name.substring(0, action.name.length - 17),
                          sizes: action.sizes,
                          images: action.images,
                          price: action.price,
                          size_price_list: action.size_price_list
                        }
              }
              else {
                return work
              }

            }
            )
            return {...room, art: updatedArtwork}
          }
          else{
            return room
          }
        })}
        if (state.loggedIn){
          postData('/state/', newState, cookies.fbToken)
        }
        return newState
      case 'ADD_NAME':
        return {...state, newRoomShow: {...state.newRoomShow, 
            selectionRoom: {...state.newRoomShow.selectionRoom, 
                name: action.name
                }}}
      
      case 'NAME_ROOM':
        if (state.rooms.map(r=>r.id).includes(action.id)) {

          newState = {...state, 
            rooms: state.rooms.map(r => {
              
              if (r.id === action.id) {
                  return {...r, name: action.name}
              }
              else {
                  return r
              }

          })}

          if (state.loggedIn){
            postData('/state/', newState, cookies.fbToken)
          }
          
          return newState
      }

      default:
        return state;
    }
  }, localState || initialState); // try the local state first, then back up to the intialState...
  
  // TODO: move state posts for logged in users into the effect... where they probably belong
  useEffect(() => {
    localStorage.setItem("deco-state", JSON.stringify(state));
    }, [state]);

  return <Provider value={{ state, dispatch }}>{children}</Provider>;
};

export { store, StateProvider }

// TODO: add the state here pulled from the backend... 

// export const generateUserDocument = async (user, additionalData) => {
//   if (!user) return;
  
//   const userRef = firestore.doc(`users/${user.uid}`);
//   const snapshot = await userRef.get();

//   if (!snapshot.exists) {
//     const { email, displayName, photoURL } = user;
//     try {
//       await userRef.set({
//         displayName,
//         email,
//         photoURL,
//         ...additionalData
//       });
//     } catch (error) {
//       console.error("Error creating user document", error);
//     }
//   }
//   return getUserDocument(user.uid);
// };
// const getUserDocument = async uid => {
//   if (!uid) return null;
//   try {
//     const userDocument = await firestore.doc(`users/${uid}`).get();
//     return {
//       uid,
//       ...userDocument.data()
//     };
//   } catch (error) {
//     console.error("Error fetching user", error);
//   }
// };



export const UserContext = createContext({ user: null });

export class UserProvider extends Component {
  state = {
    user: null
  };

  // componentDidMount = async () => {
  //   auth.onAuthStateChanged(async userAuth => {
  //     const user = await generateUserDocument(userAuth);
  //     this.setState({ user });
  //   });
  // };
  componentDidMount = () => {
    auth.onAuthStateChanged(userAuth => {
      this.setState({ user: userAuth});
    });
  };


  render() {
    return (
      <UserContext.Provider value={this.state.user}>
        {this.props.children}
      </UserContext.Provider>
    );
  }
}