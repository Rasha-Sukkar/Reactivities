import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import agent from "../api/agent";
import { useLocation } from "react-router";
import { useAccount } from "./useAccount";

export const useActivities = (id?: string) => {
  const queryclient = useQueryClient();
  const location = useLocation();
  const { currentUser } = useAccount();

  const { data: activities, isFetching } = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const response = await agent.get<Activity[]>('/activities');
      return response.data;
    },
    enabled: !id && location.pathname === '/activities' && !!currentUser,
    select: data => {
      return data.map(activity => {
        const host = activity.attendees.find(x=>x.id===activity.hostId);
        return {
          ...activity,
          isHost: currentUser?.id === activity.hostId,
          isGoing: activity.attendees.some(x => x.id === currentUser?.id),
          hostImageUrl: host?.imageUrl
        }
      })
    }
  });

  const { data: activity, isLoading: isLoadingActivity } = useQuery({
    queryKey: ['activities', id],
    queryFn: async () => {
      const response = await agent.get<Activity>(`/activities/${id}`)
      return response.data;
    },
    enabled: !!id && !!currentUser,
    select: data => {
      const host = data.attendees.find(x=>x.id===data.hostId);
      return {
        ...data,
        isHost: currentUser?.id === data.hostId,
        isGoing: data.attendees.some(x => x.id === currentUser?.id),
        hostImageUrl: host?.imageUrl
      }
    }

  })

  const updateActivity = useMutation({
    mutationFn: async (activity: Activity) => {
      await agent.put('/activities', activity)
    },
    onSuccess: async () => {
      await queryclient.invalidateQueries({
        queryKey: ['activities']
      })
    }
  })

  const createActivity = useMutation({
    mutationFn: async (activity: Activity) => {
      const response = await agent.post('/activities', activity);
      return response.data;
    },
    onSuccess: async () => {
      await queryclient.invalidateQueries({
        queryKey: ['activities']
      })
    }
  })

  const deleteActivity = useMutation({
    mutationFn: async (id: string) => {
      await agent.delete(`/activities/${id}`)
    },
    onSuccess: async () => {
      await queryclient.invalidateQueries({
        queryKey: ['activities']
      })
    }
  })

  const updateAttendance = useMutation({
    mutationFn: async (id:string)=>{
      await agent.post(`/activities/${id}/attend`)
    },
    onMutate: async (activityId:string)=>{
      await queryclient.cancelQueries({queryKey:['activities',activityId]})

      const preActivity = queryclient.getQueryData<Activity>(['activities',activityId])

      queryclient.setQueryData<Activity>(['activities',activityId],oldActivity=>{
        if (!oldActivity || !currentUser){
          return oldActivity
        }

        const isHost = oldActivity.hostId === currentUser.id;
        const isAttending = oldActivity.attendees.some(x=>x.id===currentUser.id);

        return{
          ...oldActivity,
          isCancelled:isHost? !oldActivity.isCancelled: oldActivity.isCancelled,
          attendees: isAttending?isHost?oldActivity.attendees:oldActivity.attendees.filter(x=>x.id!==currentUser.id)
          :[...oldActivity.attendees,{
            id:currentUser.id,
            displayName:currentUser.displayName,
            imageUrl:currentUser.imageUrl
          }]
        }
      })

      return {preActivity}
    },
    onError:(error,activityId, context)=>{
      console.log(error);
      if (context?.preActivity){
        queryclient.setQueryData(['activities',activityId],context.preActivity)
      }
    }
  })


  return {
    activities,
    isFetching,
    updateActivity,
    createActivity,
    deleteActivity,
    activity,
    isLoadingActivity: !!id && isLoadingActivity,
    updateAttendance
  }
}