import {Rooms} from './artComponents.js'
import React, {useState, useEffect} from 'react';
import { store } from './store.js';

const useSharedData = (sessionId, roomId, dispatch) => {
    useEffect(() => {
        if (sessionId){
            fetch(process.env.REACT_APP_PROD_API_DOMAIN+'/shared_walls/'+sessionId+'/'+roomId)
            .then(response => response.json())
            .then(data => dispatch([{...data}]));
        }
        }, [sessionId, roomId, dispatch]);
  
  }

export const SharedRoom = ({wallId, sessionId}) => {

    const [wallData, setWallData] = useState([{name: "", 
                                              id: null,
                                              art: []
                                            }]);

    useSharedData(sessionId, wallId, setWallData)

    return (<Rooms sharedRooms={wallData}/>)

}