public with sharing class FileUploadController {
    /*@AuraEnabled
    public static void uploadFileToServer(String fileName, String base64Data, String parentId) {
        try{
        // Step 1: Create ContentVersion
        ContentVersion cv = new ContentVersion();
        cv.Title = fileName;
        cv.PathOnClient = fileName;
        cv.VersionData = EncodingUtil.base64Decode(base64Data);
        insert cv;

        // Step 2: Get ContentDocumentId
        ContentVersion insertedVersion = [
            SELECT Id, ContentDocumentId FROM ContentVersion WHERE Id = :cv.Id LIMIT 1
        ];

        // Step 3: Link to parent record
        ContentDocumentLink cdl = new ContentDocumentLink();
        cdl.ContentDocumentId = insertedVersion.ContentDocumentId;
        cdl.LinkedEntityId = parentId;
        cdl.ShareType = 'V'; // View access
        cdl.Visibility = 'AllUsers';
        insert cdl;
        }catch(Exception ex){
            throw new AuraHandledException('Error:'+ex+'\n'+ex.getStackTraceString());
        }
    }*/

    @AuraEnabled
public static void uploadFilesToServer(String files, Id parentId) {
    system.debug('files:'+files);
    List<ContentFileWrapper> contentFiles = (List<ContentFileWrapper>) JSON.deserialize(files, List<ContentFileWrapper>.class);
   /* system.debug('contentFiles:'+contentFiles.size());
    if (contentFiles == null || contentFiles.size() >= 10) {
        throw new AuraHandledException('You can only upload up to 10 files at a time.');
    }
    try{
    List<ContentVersion> contentVersions = new List<ContentVersion>();

    for (ContentFileWrapper file : contentFiles) {
        system.debug('file:'+file);
        ContentVersion cv = new ContentVersion();
        cv.Title = file.fileName;
        cv.PathOnClient = file.fileName;
        cv.VersionData = EncodingUtil.base64Decode(file.base64Data);
        cv.FirstPublishLocationId = parentId;
        contentVersions.add(cv);
    }

    insert contentVersions;
}catch(Exception ex){
    system.debug(ex.getMessage()+'\n'+ex+'\n'+ex.getStackTraceString());
    throw new AuraHandledException(ex.getMessage()+'\n'+ex+'\n'+ex.getStackTraceString());
}*/

System.enqueueJob(new FileUploadQueueable(contentFiles, parentId));
 //   saveUploadFilesToServer(files,parentId);
}

public class ContentFileWrapper {
    @AuraEnabled public String fileName;
    @AuraEnabled public String base64Data;
}

/*
@Future
public static void saveUploadFilesToServer(String files, Id parentId) {
    system.debug('files:'+files);
    List<ContentFileWrapper> contentFiles = (List<ContentFileWrapper>) JSON.deserialize(files, List<ContentFileWrapper>.class);
    system.debug('contentFiles:'+contentFiles.size());
    if (contentFiles == null || contentFiles.size() >= 10) {
        throw new AuraHandledException('You can only upload up to 10 files at a time.');
    }
    try{
    List<ContentVersion> contentVersions = new List<ContentVersion>();

    for (ContentFileWrapper file : contentFiles) {
        system.debug('file:'+file);
        ContentVersion cv = new ContentVersion();
        cv.Title = file.fileName;
        cv.PathOnClient = file.fileName;
        cv.VersionData = EncodingUtil.base64Decode(file.base64Data);
        cv.FirstPublishLocationId = parentId;
        contentVersions.add(cv);
    }

    insert contentVersions;
}catch(Exception ex){
    system.debug(ex.getMessage()+'\n'+ex+'\n'+ex.getStackTraceString());
    throw new AuraHandledException(ex.getMessage()+'\n'+ex+'\n'+ex.getStackTraceString());
}
}*/

public class FileUploadQueueable implements Queueable {
    public List<FileUploadController.ContentFileWrapper> files;
    public Id parentId;

    public FileUploadQueueable(List<FileUploadController.ContentFileWrapper> files, Id parentId) {
        this.files = files;
        this.parentId = parentId;
    }

    public void execute(QueueableContext context) {
        List<ContentVersion> versions = new List<ContentVersion>();
        for (ContentFileWrapper file : files) {
            if (String.isNotBlank(file.base64Data)) {
                ContentVersion cv = new ContentVersion();
                cv.Title = file.fileName;
                cv.PathOnClient = file.fileName;
                cv.VersionData = EncodingUtil.base64Decode(file.base64Data);
                cv.FirstPublishLocationId = parentId;
                versions.add(cv);
            }
        }

        if (!versions.isEmpty()) {
            insert versions;
        }
    }
}


}