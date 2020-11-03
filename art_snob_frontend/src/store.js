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
    'artBrowseSeed': null, 
    'currentTagSet': ['Digital', 'Drawing'],
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
    'newRoomShow': {show: false, currentName: '', selectionRoom: {roomType: ''}},
    'rooms': [{
    name: "My First Room", 
    id: uuidv4(),
    roomType: "blank",
    showingMenu: false,
    art:[{id:1, size: 'medium', artId: null},
        {id:2, size: 'xsmall', artId: null},
        {id:3, size: 'xsmall', artId: null}], // usually starts out null
    arrangement: {rows: [1, {cols: [2,3]}]}, // usually starts out null
    arrangementSize: 3 // usually starts out 0
  },

  {
    name: "My Second Room", 
    id: uuidv4(),
    roomType: "blank",
    showingMenu: false,
    art:[{id:1, size: 'p_small', artId: null},
         {id:2, size: 'p_small', artId: null},
         {id:3, size: 'p_large', artId: null},
         {id:4, size: 'p_small', artId: null},
         {id:5, size: 'p_small', artId: "NULLFRAME"}
        ], // usually starts out null
    arrangement: {rows: [{cols: [1, 2]}, 3, {cols: [4, 5]}]}, // usually starts out null
    // arrangement: {"cols": [{"rows": [1, 5]}, {"rows": [5, 2]}]},
    arrangementSize: 4 // usually starts out 0
  }
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
        return {...state, rooms: state.rooms.concat(action.room)}
      case 'TOGGLE_LANDING':
        return {...state, landingState: {'open': !state.landingState.open}}
      case 'TOGGLE_NEW_ROOM_SHOW':
        return {...state, newRoomShow: {...state.newRoomShow, show: !state.newRoomShow.show}}
      case 'ASSIGN_NEW_ROOM_SHOW':
        return {...state, newRoomShow: action.newRoomShow}
      case 'ART_DETAIL':
        return {...state, artDetailShow: action.id}
      case 'POTENTIAL_ART':
        return {...state, potentialArt: action.artData}
      case 'LIKE_ART':
        postData('/actions/', { session: state.sessionId, action: 'liked', item: action.art.artId})
        return {...state, likedArt: state.likedArt.concat(action.art)}
      case 'ART_BROWSE_SEED':
        // set the potential tags
        let tagSet = new Set()
        let art;
        let tag;
        if (action.artBrowseSeed) {
            for (art of action.artBrowseSeed) {
                if ('standard_tags' in art){
                    for (tag of art.standard_tags){
                        tagSet.add(tag)
                    }
                }
            }
        }
        return {...state, artBrowseSeed: action.artBrowseSeed, currentTagSet: [...tagSet].slice(0, 10)}
      case 'CHANGE_CURRENT_TAG_SET':
          return {...state, currentTagSet: action.currentTagSet}
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
        // filter for arrangement in the room equal to action.id
        return {...state, rooms: state.rooms.map((room, _) => {
          const {id} = room
          if (id == action.id) {
           const popArt =  JSON.parse(JSON.stringify(room.art));
            // TODO -- NULL OUT THE ART IF IT DOESN'T EXIST IN THE NEW SIZE
            // TODO -- SET MAX DEVICE WIDENESS!!
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
            if ('additionalArt' in action) {
              return {...room, 
                arrangement: action.arrangement, 
                arrangementSize: action.arrangementSize,
                art: room.art.concat(action.additionalArt)}
            }
            else {
            return {...room, showingMenu: false, art: artRenumbered, 
              arrangement: action.arrangement, arrangementSize: action.arrangementSize}
          }
          }
          else{
            return room
          }
        })}
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
                          name: action.name,
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
        return {...state, rooms: state.rooms.map((room, _) => {
          const {id} = room
          if (id == action.id) {
            return {...room, name: action.name}
          }
          else {
            return room
          }

        }
        ) }
      default:
        return state;
    }
  }, initialState);
  return <Provider value={{ state, dispatch }}>{children}</Provider>;
};

export { store, StateProvider }