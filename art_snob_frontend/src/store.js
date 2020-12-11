import React, {createContext, useReducer} from 'react';
import { v4 as uuidv4 } from 'uuid';

async function postData(url = '', data = {}) {
    // Default options are marked with *
    const response = await fetch(url, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'no-cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(data) // body data type must match "Content-Type" header
    });
    return response.json(); // parses JSON response into native JavaScript objects
  }
  
    // .then(data => {
    //   console.log(data); // JSON data parsed by `data.json()` call
    // });

// todo: write a session ID to the cookies, and write the state every so often? maybe every update??
// todo: then that way for logins or whatever, we could just load the state? 

const initialState = {
    'landingState': {'open': true},
    'artDetailShow': null,
    'sessionId': uuidv4(),
    'potentialArt': null,
    'blankRoom': {reload: true, feed: [], feedCursor: null, roomType: 'blank', 'name': 'My new room', 'showingMenu': false, art: [], arrangement: {}, arrangementSize: 0, clusterData:{likes:[], dislikes:[], skipN:0, startN:0}, vibes: [], 'seedTags': [], 'seedArt': []},
    'artBrowseSeed': null, 
    'purchaseList': null,
    'searchTagSet': [],
    'likedArt': [],
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
    'newRoomShow': {show: true, currentName: 'My new room', 
    selectionRoom: {reload: true, feed: [], feedCursor: null, roomType: 'blank', 'name': 'My new room', 'showingMenu': false, art: [], arrangement: {}, arrangementSize: 0, clusterData:{likes:[], dislikes:[], skipN:0, startN:0}, vibes: [], 'seedTags': [], 'seedArt': []}},
    'rooms': [
      
  // {
  //   name: "My First Room", 
  //   id: uuidv4(),
  //   roomType: "blank",
  //   showingMenu: false,
  //   art:[{id:1, size: 'medium', artId: null},
  //       {id:2, size: 'xsmall', artId: null},
  //       {id:3, size: 'xsmall', artId: null}], // usually starts out null
  //   arrangement: {rows: [1, {cols: [2,3]}]}, // usually starts out null
  //   arrangementSize: 3 // usually starts out 0
  // },

  // {
  //   name: "My Second Room", 
  //   id: uuidv4(),
  //   roomType: "blank",
  //   showingMenu: false,
  //   art:[{id:1, size: 'p_small', artId: null},
  //        {id:2, size: 'p_small', artId: null},
  //        {id:3, size: 'p_large', artId: null},
  //        {id:4, size: 'p_small', artId: null},
  //        {id:5, size: 'p_small', artId: "NULLFRAME"}
  //       ], // usually starts out null
  //   arrangement: {rows: [{cols: [1, 2]}, 3, {cols: [4, 5]}]}, // usually starts out null
  //   // arrangement: {"cols": [{"rows": [1, 5]}, {"rows": [5, 2]}]},
  //   arrangementSize: 4 // usually starts out 0
  // }
]

};

const store = createContext(initialState);
const { Provider } = store;

const StateProvider = ( { children } ) => {
  const [state, dispatch] = useReducer(
      (state, action) => {
    // TODO: delete rooms 
    console.log('StateProvider:ACTION', action)
    console.log('StateProvider:STATE', state)
    switch(action.type){
      case 'ADD_ROOM':
        if (state.rooms.map(r=>r.id).includes(action.room.id)) {
            return {...state, rooms: state.rooms.map(r => {
                
                if (r.id === action.room.id) {
                    return action.room
                }
                else {
                    return r
                }

            })}
        }
        else {
            return {...state, rooms: state.rooms.concat(action.room)}
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
                dislikes: state.newRoomShow.selectionRoom.clusterData.dislikes.concat(action.dislike)}}}}
      }
      case 'CLUSTER_SKIP':
        const currentSkip = state.newRoomShow.selectionRoom.clusterData.skipN
        return {...state, newRoomShow: {...state.newRoomShow, 
          selectionRoom: {...state.newRoomShow.selectionRoom, 
            clusterData: {...state.newRoomShow.selectionRoom.clusterData, 
              skipN: currentSkip+1}}}}

      case 'CLUSTER_MORE':
          const currentStart = state.newRoomShow.selectionRoom.clusterData.startN
          return {...state, newRoomShow: {...state.newRoomShow, 
            selectionRoom: {...state.newRoomShow.selectionRoom, 
              clusterData: {...state.newRoomShow.selectionRoom.clusterData, 
                startN: currentStart+1}}}}
      
      case 'ADD_FEED_IMAGES':
        return {...state, artBrowseSeed: {...state.artBrowseSeed, feed: state.artBrowseSeed.feed.concat(action.images), feedCursor: action.cursor}}

      case 'CLEAR_FEED_IMAGES':
          return {...state, artBrowseSeed: {...state.artBrowseSeed, feed: [], feedCursor: null}}
      
      case 'RELOAD_FEED':
          return {...state, artBrowseSeed: {...state.artBrowseSeed, reload: !state.artBrowseSeed.reload}}

      case 'TOGGLE_VIBE':
      // add vibes to the pending (or current) room selection
        if (state.newRoomShow.selectionRoom.vibes.map(v => v.Vibes).includes(action.vibe.Vibes)) {
            const removedVibe = state.newRoomShow.selectionRoom.vibes.filter(v => v.Vibes !== action.vibe.Vibes)
            return {...state, newRoomShow: {...state.newRoomShow, selectionRoom: {...state.newRoomShow.selectionRoom, vibes: removedVibe}}}
        }
        else {
            return {...state, newRoomShow: {...state.newRoomShow, selectionRoom: {...state.newRoomShow.selectionRoom, vibes: state.newRoomShow.selectionRoom.vibes.concat(action.vibe)}}}
        }
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
        return {...state, newRoomShow: {...state.newRoomShow, show: !state.newRoomShow.show, currentName: '', selectionRoom: {roomType: ''}}}
      case 'ASSIGN_NEW_ROOM_SHOW':
        return {...state, newRoomShow: action.newRoomShow}
      case 'ART_DETAIL':
        return {...state, artDetailShow: action.id}
      case 'POTENTIAL_ART':
        return {...state, potentialArt: action.artData}
      case 'LIKE_ART':
        postData('/actions/', { session: state.sessionId, action: 'liked', item: action.art.artId})
        return {...state, likedArt: state.likedArt.concat(action.art)}
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
          return {...state, searchTagSet: action.searchTagSet}
      case 'CHANGE_MENU':
        // filter for arrangement in the room equal to action.id
        return {...state, 'rooms': state.rooms.map((room, _) => {
          const {id} = room
          if (id == action.id) {
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
            if (a.artId != 'NULLFRAME') {
              let sPopArt = {...popArt.shift(), id: a.id, size: a.size}
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
        return {...state, newRoomShow: {...state.newRoomShow, 
            selectionRoom: {...state.newRoomShow.selectionRoom, 
                arrangement: action.arrangement,
                arrangementSize: action.arrangementSize,
                art: artRenumbered
                }}}
      case 'ADD_ROOMTYPE':
        return state.rooms.map((room, _) => {
          const {id} = room
          if (id == action.id) {
            return {...room, room_type: action.room_type}
          }
          else{
            return room
          }
        })
      case 'ADD_ART':
        postData('/actions/', { session: state.sessionId, action: 'addtoroom:'+action.roomId, item: action.artId})
        return {...state, rooms: state.rooms.map((room, _) => {
          const {id} = room
          if (id == action.roomId) {
              const updatedArtwork = room.art.map((work, _) => {
              if (work.id == action.roomArtId) {
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
      case 'ADD_NAME':
        return {...state, newRoomShow: {...state.newRoomShow, 
            selectionRoom: {...state.newRoomShow.selectionRoom, 
                name: action.name
                }}}
      default:
        return state;
    }
  }, initialState);
  return <Provider value={{ state, dispatch }}>{children}</Provider>;
};

export { store, StateProvider }