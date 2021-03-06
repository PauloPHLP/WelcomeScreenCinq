const moment = require('moment');
const {ScreenVideo} = require('./../server/models/screen_video');
const {ScreenImage} = require('./../server/models/screen_image');
let isDefault = false;
let isEnabled = false;

module.exports = {
  EnableDisableImagesAndVideos: isEnabled => {
    module.exports.EnableDisableImages(isEnabled);
    module.exports.EnableDisableVideos(isEnabled);
  },

  EnableDisableImages: isActivated => {
    ScreenImage.find().then(docImage => {
      docImage.forEach(image => {
        if (image.activated === "true")
          ScreenImage.updateOne({_id: image._id}, {$set: {activated: isActivated}}, (err, screenImage) => {}); 
      });
    });
  },

  EnableDisableVideos: isActivated => {
    ScreenVideo.find().then(docVideo => {
      docVideo.forEach(video => {
        if (video.activated === "true")
          ScreenVideo.updateOne({_id: video._id}, {$set: {activated: isActivated}}, (err, screenVideo) => {});
      });
    });
  },

  EnableDisableDefaultVideo: isActivated => {
    ScreenVideo.find().then(docVideo => {
      docVideo.forEach(video => {
        if (video.isDefaultVideo === true && video.activated !== "programmed")
          ScreenVideo.updateOne({_id: video._id}, {$set: {activated: isActivated}}, (err, screenVideo) => {});
      });
    });
  },

  EnableDefaultVideoIfNoImages: () => {
    ScreenImage.countDocuments({activated: 'true'}, function(err, count) {
      if (count === 0) {
        module.exports.EnableDisableDefaultVideo('true');
      }
      if (count > 0) {
        module.exports.EnableDisableVideos('false');
      }
    });
  },

  EnableDefaultVideoIfNoVideos: () => {
    ScreenVideo.countDocuments({activated: 'true'}, function(err, count) {
      if (count === 0) 
        module.exports.EnableDisableDefaultVideo('true');
    });
  },

  EnableDisableDefaultVideoIfNoWS: () => {
    ScreenImage.countDocuments({activated: 'true'}, function(err, countImages) {
      ScreenVideo.countDocuments({activated: 'true'}, function(err, countVideos) {
        if (countImages === 0 && countVideos === 0) 
          module.exports.EnableDisableDefaultVideo('true');
      });
    });
  },

  DisableEverythingButCurrentVideo: id => {
    module.exports.EnableDisableImages("false");
    ScreenVideo.find().then(docVideo => {
      docVideo.forEach(video => {
        if (video._id != id && video.activated !== 'programmed') 
          ScreenVideo.updateOne({_id: video._id}, {$set: {activated: 'false'}}, (err, screenVideo) => {});
      });
    });
  },

  EnableCurrentAndDisableAll: id => {
    module.exports.EnableDisableImages("false");
    ScreenVideo.find().then(docVideo => {
      docVideo.forEach(video => {
        if (video._id != id && video.activated !== 'programmed') 
          ScreenVideo.updateOne({_id: video._id}, {$set: {activated: 'false'}}, (err, screenVideo) => {});
        if (video._id === id)
          ScreenVideo.updateOne({_id: video._id}, {$set: {activated: 'true'}}, (err, screenVideo) => {});
      });
    });
  },

  DisableAllButCurrent: id => {
    module.exports.EnableDisableImages("false");
    ScreenVideo.find().then(doc => {
      doc.forEach(video => {
        if (video._id !== id)
          ScreenVideo.updateOne({_id: video._id}, {$set: {activated: 'false'}}, (err, screenVideo) => {});
      });
    });
  },

  EnableDisableProgrammedWs: () => {
    ScreenVideo.find().then(docVideo => {
      docVideo.forEach(video => {
        if (video.activated === 'programmed' && module.exports.CheckProgrammedDate(video) === true) {
          docVideo.forEach(vid => {
            if (vid.activated === 'true')
              ScreenVideo.updateOne({_id: vid._id}, {$set: {activated: 'false'}}, (err, screenVideo) => {});
          });
          ScreenVideo.updateOne({_id: video._id}, {$set: {activated: 'true'}}, (err, screenVideo) => {});
        } 
      });
    });
  },

  async RetriveProgrammedVideos () {
    return await ScreenVideo.find();
  },

  async RetriveProgrammedImages () {
    return await ScreenImage.find();
  },

  SetProgrammedWS: () => {
    module.exports.SetProgrammedVideo();
    module.exports.SetProgrammedImage();
  },  

  SetProgrammedVideo: () => {
    ScreenVideo.find().then(docVideo => {
      module.exports.EnableDisableImages("false");
      docVideo.forEach(video => {
        if (video.activated === 'programmed' && module.exports.CheckProgrammedDate(video) === true) {
          docVideo.forEach(vid => {
            if (vid.activated === 'true')
              ScreenVideo.updateOne({_id: vid._id}, {$set: {activated: 'false'}}, (err, screenVideo) => {});
          });
          ScreenVideo.updateOne({_id: video._id}, {$set: {activated: 'true'}}, (err, screenVideo) => {});
        } else if (video.activated === 'true' && module.exports.CheckProgrammedDate(video) === false) {
          ScreenVideo.updateOne({_id: video._id}, {$set: {activated: 'false'}}, (err, screenVideo) => {});
          module.exports.EnableDisableDefaultVideoIfNoWS();
        }
      });
    });
  },

  SetProgrammedImage: () => {
    ScreenImage.find().then(doc => {
      doc.forEach(image => {
        if (image.activated === 'programmed' && module.exports.CheckTime(image.startDate, image.endDate) === true) {
          module.exports.EnableDisableVideos('false');
          ScreenImage.updateOne({_id: image._id}, {$set: {activated: 'true'}}, (err, screenImage) => {});
        } else if (image.activated === 'true' && module.exports.CheckTime(image.startDate, image.endDate) === false) {
          ScreenImage.updateOne({_id: image._id}, {$set: {activated: 'false'}}, (err, screenImage) => {});
          module.exports.EnableDisableDefaultVideoIfNoWS();
        }
      });
    });
  },

  RenderSettings: (defaultName, activated) => {
    if (((defaultName === 'default_video.mp4') || (defaultName === 'default_image.jpg')) && (activated === "true")) {
      this.isDefault = true;
      this.isEnabled = "true";
    } else if (((defaultName === 'default_video.mp4') || (defaultName === 'default_image.jpg')) && (activated === "false")) {
      this.isDefault = true;
      this.isEnabled = "false";
    } else if (((defaultName === 'default_video.mp4') || (defaultName === 'default_image.jpg')) && (activated === "programmed")) {
      this.isDefault = true;
      this.isEnabled = "programmed";
    } else if (((defaultName !== 'default_video.mp4') && (defaultName !== 'default_image.jpg')) && (activated === "true")) {
      this.isDefault = false;
      this.isEnabled = "true";
    } else if (((defaultName !== 'default_video.mp4') && (defaultName !== 'default_image.jpg')) && (activated === "false")) {
      this.isDefault = false;
      this.isEnabled = "false";
    } else {
      this.isDefault = false;
      this.isEnabled = "programmed";
    }

    return {
      isDefault: this.isDefault,
      isEnabled: this.isEnabled
    };
  },

  CheckTime: (startDate, endDate) => {
    const dateNow = module.exports.GetDateEnrollFormat();
    
    if (dateNow >= startDate && dateNow < endDate)
      return true;
    else if (dateNow >= endDate)
      return false;
    else 
      return null;
  },

  GetDate: () => {
    return moment(Date.now()).format('MM/DD/YY');
  },

  GetDateEnrollFormat: () => {
    return moment(Date.now()).format('DD-M-YY H:m');
  },

  FormatDate: date => {
    return moment(moment(date, 'DD/MM/YYYY HH:mm')).format('DD/MM/YYYY - HH:mm');
  },

  FormatDateUgly: date => {
    return moment(date).format('DD-M-YY H:m');
  },

  FormatDateToUpdate: date => {
    return moment(moment(date, 'DD/MM/YYYY HH:mm')).format('DD-M-YY H:m');
  },

  CheckProgrammedDate: video => {
    const dateNow = module.exports.FormatDate(new Date());

    if (dateNow >= module.exports.FormatDate(video.startDate) && dateNow < module.exports.FormatDate(video.endDate)) {
      return true;
    } else if (dateNow >= module.exports.FormatDate(video.endDate)) {
      return false;
    } else
      return null;
  },

  CheckProgrammedStartAndEndDate: req => {
    if (req.params.isProgrammed === "programmed") {
      return {
        startDate: req.params.startDate,
        endDate: req.params.endDate
      }
    } else {
      return {
        startDate: null,
        endDate: null
      }
    }
  },

  CheckAvailability: ws => {
    if (ws.activated === 'true') {
      return `<td class="releway-font"><i class="material-icons on-icon">
      fiber_manual_record
      </i> Enabled</td>`;
    } else if (ws.activated === 'false') {
      return `<td class="releway-font"><i class="material-icons off-icon">
      fiber_manual_record
      </i> Disabled</td>`;
    } else if (ws.activated === 'programmed') {
      return `<td class="releway-font"><i class="material-icons programmed-icon">
      fiber_manual_record
      </i> Scheduled to ${module.exports.FormatDate(ws.startDate)}</td>`;
    }
  },

  CompanyList: companyName => {
    if (companyName !== '') 
      return `<li class="company_name col-lg-6 col-md-6 col-sm-12 col-xs-12"> ${companyName}</li>`;
    else if (companyName === '') {
      return `<li class="company_name col-lg-6 col-md-6 col-sm-12 col-xs-12">&nbsp</li>`;
    }
  },

  GuestList: guestsNames => {
    let guestNamesList = '';
    guestsNames.forEach(guestName => {
      if (guestName !== '') 
        guestNamesList += `<li class="guest-item col-lg-6 col-md-6 col-sm-12 col-xs-12">&#x2022; ${guestName}</li>`;
      else if (guestName === '') {
        guestNamesList += `<li class="guest-item col-lg-6 col-md-6 col-sm-12 col-xs-12">&nbsp</li>`;
      }
    });
    
    return guestNamesList;
  },

  GetDateArray: date => {
    if (date !== null && date != undefined) {
      date = date.replace(' ', '-').replace(':', '-').split('-');
      return {
        day: date[0],
        month: date[1] - 1,
        year: date[2],
        hour: date[3],
        minute: date[4],
        second: 0
      }
    } else {
      return null;
    }
  },

  DisableWSProgrammedAtTheSameTimeForVideo: newVideo => {
    ScreenVideo.find({activated: 'programmed'}).then(docVideo => {
      docVideo.forEach(video => {
        let result = module.exports.CompareNewAndProgrammedDates(newVideo, video);
        
        if (result === false && newVideo._id != video._id) 
          ScreenVideo.updateOne({_id: video._id}, {$set: {activated: 'false', startDate: null, endDate: null}}, (err, screenVideo) => {});
      });
    });
    ScreenImage.find({activated: 'programmed'}).then(docImage => {
      docImage.forEach(image => {
        let result = module.exports.CompareNewAndProgrammedDates(newVideo, image);
        if (result === false)
          ScreenImage.updateOne({_id: image._id}, {$set: {activated: 'false', startDate: null, endDate: null}}, (err, screenImage) => {});
      });
    });
  },

  DisableWSProgrammedAtTheSameTimeForImage: newImage => {
    ScreenVideo.find({activated: 'programmed'}).then(docVideo => {
      docVideo.forEach(video => {
        let result = module.exports.CompareNewAndProgrammedDates(newImage, video);
        if (result === false)
          ScreenVideo.updateOne({_id: video._id}, {$set: {activated: 'false', startDate: null, endDate: null}}, (err, screenVideo) => {});
      });
    });
  },

  CompareNewAndProgrammedDates: (newDate, oldDate) => {
    if (newDate.startDate >= oldDate.startDate && newDate.startDate < oldDate.endDate)
      return false;
    if (newDate.endDate > oldDate.startDate && newDate.endDate < oldDate.endDate)
      return false;
    return true;
  },

  SplitIds: idString => {
    return idString.split(',');
  }
}