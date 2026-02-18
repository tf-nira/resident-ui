import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  appConfig: any;
  constructor(public http: HttpClient) { }
  
  async loadAppConfig(): Promise<void> {
    try {
      // Load local config.json
      this.appConfig = await this.http.get('./assets/config.json').toPromise();
      // Load additional config from remote endpoint
      const response = await this.http.get(this.appConfig.baseUrl + '/proxy/config/ui-properties').toPromise();
      const responseData = response["response"];
      if(!localStorage.getItem("langCode")){
        localStorage.setItem("langCode", responseData["mosip.mandatory-languages"]);
      }
      this.appConfig["supportedLanguages"] = responseData["mosip.mandatory-languages"] + ","+ responseData["mosip.optional-languages"];
      this.appConfig["mosip.iam.adapter.clientid"] = responseData["mosip.iam.adapter.clientid"];
      this.appConfig["mosip.resident.api.id.otp.request"] = responseData["mosip.resident.api.id.otp.request"];
      this.appConfig["mosip.resident.api.version.otp.request"] = responseData["mosip.resident.api.version.otp.request"];
      this.appConfig["resident.vid.id"] = responseData["resident.vid.id"];      
      this.appConfig["resident.vid.version"] = responseData["resident.vid.version"]; 
      this.appConfig["mosip.resident.request.response.version"] = responseData["mosip.resident.request.response.version"];    
      this.appConfig["resident.revokevid.id"] = responseData["resident.revokevid.id"]; 
      this.appConfig["mosip-prereg-host"] = responseData["mosip-prereg-host"];   
      this.appConfig["mosip-prereg-ui-url"] = responseData["mosip-prereg-ui-url"];     
      this.appConfig["auth.types.allowed"] = responseData["auth.types.allowed"];   
      this.appConfig["resident.view.history.serviceType.filters"] = responseData["resident.view.history.serviceType.filters"];   
      this.appConfig["resident.view.history.status.filters"] = responseData["resident.view.history.status.filters"];  
      this.appConfig["mosip.resident.grievance.url"] = responseData["mosip.resident.grievance.url"]; 
      this.appConfig["resident.vid.id.generate"] = responseData["resident.vid.id.generate"];
      this.appConfig["resident.vid.version.new"] = responseData["resident.vid.version.new"];   
      this.appConfig["mosip.resident.revokevid.id"] = responseData["mosip.resident.revokevid.id"]; 
      this.appConfig["resident.revokevid.version.new"] = responseData["resident.revokevid.version.new"]; 
      this.appConfig["mosip.resident.download.personalized.card.id"] = responseData["mosip.resident.download.personalized.card.id"]
      this.appConfig["mosip.resident.download.registration.centre.file.name.convention"] = responseData["mosip.resident.download.registration.centre.file.name.convention"];
      this.appConfig["mosip.resident.download.supporting.document.file.name.convention"] = responseData["mosip.resident.download.supporting.document.file.name.convention"];  
      this.appConfig["mosip.resident.download.personalized.card.naming.convention"] = responseData["mosip.resident.download.personalized.card.naming.convention"]; 
      this.appConfig["mosip.resident.ack.manage_my_vid.name.convention"] = responseData["mosip.resident.ack.manage_my_vid.name.convention"]; 
      this.appConfig["mosip.resident.ack.secure_my_id.name.convention"] = responseData["mosip.resident.ack.secure_my_id.name.convention"]; 
      this.appConfig["mosip.resident.ack.personalised_card.name.convention"] = responseData["mosip.resident.ack.personalised_card.name.convention"]; 
      this.appConfig["mosip.resident.ack.update_my_data.name.convention"] = responseData["mosip.resident.ack.update_my_data.name.convention"]; 
      this.appConfig["mosip.resident.ack.share_credential.name.convention"] = responseData["mosip.resident.ack.share_credential.name.convention"]; 
      this.appConfig["mosip.resident.ack.order_physical_card.name.convention"] = responseData["mosip.resident.ack.order_physical_card.name.convention"]; 
      this.appConfig["mosip.resident.ack.name.convention"] = responseData["mosip.resident.ack.name.convention"]; 
      this.appConfig["mosip.resident.uin.card.name.convention"] = responseData["mosip.resident.uin.card.name.convention"]; 
      this.appConfig["mosip.resident.vid.card.name.convention"] = responseData["mosip.resident.vid.card.name.convention"]; 
      this.appConfig["mosip.resident.download.service.history.file.name.convention"] = responseData["mosip.resident.download.service.history.file.name.convention"]; 
      this.appConfig["mosip.resident.download.nearest.registration.centre.file.name.convention"] = responseData["mosip.resident.download.nearest.registration.centre.file.name.convention"]; 
      this.appConfig["resident.nearby.centers.distance.meters"] = responseData["resident.nearby.centers.distance.meters"];
      this.appConfig["mosip.resident.captcha.sitekey"] = responseData["mosip.resident.captcha.sitekey"];   
      this.appConfig["mosip.resident.captcha.secretkey"] = responseData["mosip.resident.captcha.secretkey"]; 
      this.appConfig["mosip.webui.auto.logout.idle"] = responseData["mosip.webui.auto.logout.idle"]; 
      this.appConfig["mosip.webui.auto.logout.ping"] = responseData["mosip.webui.auto.logout.ping"];   
      this.appConfig["mosip.webui.auto.logout.timeout"] = responseData["mosip.webui.auto.logout.timeout"];
      this.appConfig["resident.updateuin.id"] = responseData["resident.updateuin.id"];
      this.appConfig["resident.ui.notification.update.interval.seconds"] = responseData["resident.ui.notification.update.interval.seconds"];  
      this.appConfig["mosip.kernel.otp.expiry-time"] = responseData["mosip.kernel.otp.expiry-time"];
      this.appConfig["resident.grievance-redressal.comments.chars.limit"] = responseData["resident.grievance-redressal.comments.chars.limit"];
      this.appConfig["resident.grievance-redressal.alt-email.chars.limit"] = responseData["resident.grievance-redressal.alt-email.chars.limit"];  
      this.appConfig["resident.grievance-redressal.alt-phone.chars.limit"] = responseData["resident.grievance-redressal.alt-phone.chars.limit"]; 
      this.appConfig["resident.validation.event-id.regex"] = responseData["resident.validation.event-id.regex"];
      this.appConfig["resident.purpose.allowed.special.char.regex"] = responseData["resident.purpose.allowed.special.char.regex"];
      this.appConfig["mosip.resident.captcha.enable"] = responseData["mosip.resident.captcha.enable"];
      this.appConfig["mosip.kernel.vid.length"] = responseData["mosip.kernel.vid.length"];
      this.appConfig["mosip.kernel.uin.length"] = responseData["mosip.kernel.uin.length"];
      this.appConfig["mosip.kernel.nin.length"] = responseData["mosip.kernel.nin.length"];
      this.appConfig["mosip.kernel.rid.length"] = responseData["mosip.kernel.rid.length"];   
      this.appConfig["mosip.resident.transliteration.transliterate.id"] = responseData["mosip.resident.transliteration.transliterate.id"];
      this.appConfig["resident.contact.details.update.id"] = responseData["resident.contact.details.update.id"];
      this.appConfig["mosip.resident.zoom"] = responseData["mosip.resident.zoom"];
      this.appConfig["mosip.resident.maxZoom"] = responseData["mosip.resident.maxZoom"];
      this.appConfig["mosip.resident.minZoom"] = responseData["mosip.resident.minZoom"];
      this.appConfig["resident.update-uin.machine-zone-code"] = responseData["resident.update-uin.machine-zone-code"];
      this.appConfig["mosip.mandatory-languages"] = responseData["mosip.mandatory-languages"];
    } catch (error) {
      console.error("Error loading configuration", error);
      throw error;
    }
  }

  getConfig() {
    return this.appConfig;
  }
}
