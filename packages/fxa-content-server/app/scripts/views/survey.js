import BackMixin from './mixins/back-mixin';
import Cocktail from 'cocktail';
import ServiceMixin from './mixins/service-mixin';
import SettingsPanelMixin from './mixins/settings-panel-mixin';
/*eslint-disable no-unused-vars*/
import React, { useState, useEffect } from 'react';
/*eslint-enable no-unused-vars*/

/*eslint-disable no-unused-vars*/
import Survey, {
  CreateHandleIframeTask,
} from '../../../../fxa-components/Survey/index.tsx';
/*eslint-enable no-unused-vars*/

/*
config = {
  surveys: [
    {
      id: 'portugese-speaking-mobile-users-in-southern-hemisphere',
      conditions: [{platform: 'mobile', region: 'southernHemisphere', lang: 'pt', relier: 'email'}],
      view: ['settings-home'],
      rate: 0.1,
      url: 'https://www.surveygizmo.com/s3/5541940/portugese-speaking-mobile-users-in-southern-hemisphere'
    }
  ]
}

There will be multiple surveys at times.

Will need to set a date in local or session storage to indicate
the last time a survey was shown to the user. We want to
avoid showing the user more than one survey per month.

*/

const SurveyWrapperView = surveyURL => {
  const [showSurvey, setShowSurvey] = useState(true);
  const [surveyComplete, setSurveyComplete] = useState(false);

  const handleIframeTask = CreateHandleIframeTask(() => {
    setSurveyComplete(true);
    setTimeout(() => {
      setShowSurvey(false);
    }, 300);
  });

  useEffect(() => {
    // here we are listening for the 'survey complete'
    // message from surveygizmo
    window.addEventListener('message', handleIframeTask);
    return () => window.removeEventListener('message', handleIframeTask);
  });

  return (
    <>
      {showSurvey && <Survey surveyURL={surveyURL} {...{ surveyComplete }} />}
    </>
  );
};

Cocktail.mixin(SurveyWrapperView, SettingsPanelMixin, ServiceMixin, BackMixin);

export default SurveyWrapperView;
