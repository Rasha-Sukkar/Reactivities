import { List, ListItem, ListItemText } from "@mui/material";
import Typography from "@mui/material/Typography";
import axios from "axios";
import {useEffect, useState } from "react";

function App() {
  const [activities, setActivities] = useState<Activity[]>([]);     

  useEffect(() => {
  axios.get<Activity[]>('https://localhost:5001/api/activities')
  .then(response => setActivities(response.data))

  return () => {}
  },[])
  return (
    <>
      <Typography variant='h3'>Reactivities</Typography>
      <List>
        {activities.map((activity)=> (
          <ListItem key={activity.id}>
            <ListItemText>{activity.title}</ListItemText>
          </ListItem>
        ))}
      </List>
    </>
  )
}

export default App
