import React from 'react'

export default function Index(props) {
    React.useEffect(() => {
        //pairnw to token pou eixa apo8hkeusei sto login.js
        const userToken = localStorage.getItem('userToken');

        //prepei na elegxw an einai uparxei to token, dioti an den uparxei tote den egine swsta to login (ka8e xrhsths pou kanei login prepei na exei token). Etsi an den uparxei stelnw sto login page alliws sto dashboard page
        if(!userToken){
            props.history.push('/login');
        }
        else{
            props.history.push('/lobby')
        }
    }, [])

    return (
        <div>
        </div>
    )
}
