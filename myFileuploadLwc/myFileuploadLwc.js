import { LightningElement, api, track } from 'lwc';
import uploadFilesToServer from '@salesforce/apex/FileUploadController.uploadFilesToServer';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';

export default class MyFileuploadLwc extends NavigationMixin(LightningElement) {
    @api recordId; // Pass this from parent or set it in Apex context
    @track isLoading = false;
    // Allowed file formats
    // acceptedFormats = ['.pdf', '.png', '.jpg', '.docx', '.xlsx','.csv'];

    /* handleUploadFinished(event) {
         const uploadedFiles = event.detail.files;
         console.log('Files uploaded:', uploadedFiles);
         // Optional: show toast or refresh view
     }*/

    @track files = [];

    handleDragOver(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
    }

    handleDrop(event) {
        event.preventDefault();
        const droppedFiles = Array.from(event.dataTransfer.files);
        this.files = [...this.files, ...droppedFiles];
    }

    triggerFileSelect() {
        this.template.querySelector('input[type="file"]').click();
    }

    handleFilesChange(event) {
        const selectedFiles = Array.from(event.target.files);
        this.files = [...this.files, ...selectedFiles];

    }

    get hasFiles() {
        return this.files.length > 0;
    }

    get fileCountMessage() {
        return `${this.files.length} file${this.files.length > 1 ? 's' : ''} selected`;
    }
    @track counter = 0;

    /*uploadFiles() {
        this.counter = 0;
        console.log('files selected:'+this.files.length);
        //console.log(this.files.length);
        //console.log(this.files[0].name);)
        this.files.forEach(file => {
            const reader = new FileReader();
            this.isLoading = true;
           // console.log('File size is'+file.size);
            console.log('File name is'+file.name);
            reader.onload = () => {
                const base64 = reader.result.split(',')[1];
                uploadFileToServer({ fileName: file.name, base64Data: base64, parentId: this.recordId })
                    .then(() => {
                        console.log(' uploaded successfully.');
                        this.counter++;
                        this.isLoading = false;
                        if (this.counter == this.files.length) {
                            const evt = new ShowToastEvent({
                                title: 'Success',
                                message: 'Files are uploaded successfully.',
                                variant: 'success',
                            });
                            this.dispatchEvent(evt);
                            this.files = [];
                        }
                    })
                    .catch(error => {
                        // console.error(`Error uploading ${file.name}: `, error);
                        this.isLoading = false;
                        console.log(error);
                        this.error = error;
                        let message = 'Unknown error';
                        if (Array.isArray(error.body)) {
                            message = error.body.map(e => e.message).join(', ');
                        } else if (typeof error.body.message === 'string') {
                            message = error.body.message;
                        }
                        const evt = new ShowToastEvent({
                            title: 'ERROR',
                            message: message,
                            variant: 'error',
                            mode: 'dismissable'
                        });
                        this.dispatchEvent(evt);
                        console.log('Error:' + message);
                    });
            };
            reader.readAsDataURL(file);
        });

    }*/

    // Number of files to upload at a time

   

async uploadFiles() {
    let BATCH_SIZE = 5; 
    const DELAY_MS = 60000; //10 seconds delay
    this.isLoading = true;
    let successfulUploads = 0;

    for (let i = 0; i < this.files.length; i += BATCH_SIZE) {
        const batch = this.files.slice(i, i + BATCH_SIZE);
        try {
            const base64Files = await Promise.all(batch.map(file => this.readFileAsBase64(file)));
            await uploadFilesToServer({ 
                files: JSON.stringify(base64Files), 
                parentId: this.recordId 
            });
            successfulUploads += batch.length;
            if (i + BATCH_SIZE < this.files.length) {
                await this.sleep(DELAY_MS);
            }
        } catch (error) {
            batch.forEach(file => this.showErrorToast(file.name, error));
        }
    }

    this.isLoading = false;

    this.dispatchEvent(new ShowToastEvent({
        title: 'Upload complete',
        message: `${successfulUploads} file(s) uploaded successfully.`,
        variant: 'success'
    }));

    this.files = [];
}

sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1]; // Everything after "data:*/*;base64,"
            console.log(`Base64 for ${file.name}:`, base64?.substring(0, 30)); // Short preview
            resolve({
                fileName: file.name,
                base64Data: base64
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}



    showErrorToast(fileName, error) {
        try {
            console.log(error);
            let message = 'Unknown error';
            if (Array.isArray(error.body)) {
                message = error.body.map(e => e.message).join(', ');
            } else if (typeof error.body.message === 'string') {
                message = error.body.message;
            }
            this.dispatchEvent(new ShowToastEvent({
                title: `Error uploading ${fileName}`,
                message: message,
                variant: 'error',
                mode: 'dismissable'
            }));
            console.error(`Error uploading ${fileName}: `, message);
        } catch (err) {
            console.log(err.stack);
        }
    }



}