export const ENVIRONMENT_TIMING=Object.freeze({dayStartHour:7,nightStartHour:19,weatherIntervalSeconds:300,transitionSeconds:10,manualLightSeconds:1.8,manualWeatherSeconds:2.4});
export function localDay(date,config=ENVIRONMENT_TIMING){const hour=date.getHours()+date.getMinutes()/60;return hour>=config.dayStartHour&&hour<config.nightStartHour?'day':'night';}
export function createEnvironmentCycle(environment,{now=()=>new Date(),config=ENVIRONMENT_TIMING}={}){
 let dayMode='auto',weatherMode='auto',elapsed=0,visible=true,dayCheck=0;
 const sequence=['clear','rain','snow'];
 if(environment.initialize)environment.initialize(localDay(now(),config));else{environment.setDay(localDay(now(),config));environment.setWeather('clear');}
 function refreshDay(){if(dayMode==='auto')environment.setDay(localDay(now(),config));}
 return {get dayMode(){return dayMode;},get weatherMode(){return weatherMode;},get elapsed(){return elapsed;},
  selectDay(mode){if(!['auto','day','night'].includes(mode))return;dayMode=mode;if(mode==='auto')refreshDay();else environment.setDay(mode,{duration:config.manualLightSeconds});},
  selectWeather(mode){if(!['auto',...sequence].includes(mode))return;weatherMode=mode;elapsed=0;if(mode!=='auto')environment.setWeather(mode,{duration:config.manualWeatherSeconds});},
  setVisible(value){visible=value;dayCheck=0;if(value)refreshDay();},
  update(activeDelta,wallDelta=activeDelta){if(!visible)return;dayCheck+=wallDelta;if(dayCheck>=20){dayCheck=0;refreshDay();}if(weatherMode!=='auto'||activeDelta<=0)return;elapsed+=activeDelta;if(elapsed>=config.weatherIntervalSeconds){elapsed=0;environment.setWeather(sequence[(sequence.indexOf(environment.weather)+1)%sequence.length]);}},
  stats(){return {dayMode,weatherMode,elapsed,visible};}
 };
}
