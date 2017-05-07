javascript:(function () { 
    const newMemberUrl = 'https://beta.lds.org/mls/mbr/services/report/members-moved-in/unit/472050/3?lang=eng';
    const memberProfileUrl = 'https://beta.lds.org/mls/mbr/records/member-profile/service/';

    let csvNewMembers = 'Name,"Move in Date","Individual Email","Household Email"\n';

    generateNewMemberList();

    function generateNewMemberList() {
        requestJson(newMemberUrl, onGetNewMemberListSuccess, () => console.error('Failed to get new member list.'));
    }

    function onGetNewMemberListSuccess(list) {
        for (let member of list) {
            processNewMember(member);
        }
        saveNewMembers(csvNewMembers);
    }

    function processNewMember(member) {
        let name = member.spokenName;
        let moveInDate = member.moveDate;
        let individualEmail = member.email;
        let householdEmail = member.householdEmail;
        csvNewMembers += '"' + name + '","' + moveInDate + '",' + individualEmail + ',"' + householdEmail + '\n';
    }

    function requestJson(url, onSuccess, onError) {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    if (onSuccess) {
                        let response = JSON.parse(xhr.responseText);
                        onSuccess(response);
                    }
                } else {
                    if (onError) {
                        onError();
                    }
                }
            }
        };
        xhr.open('GET', url);
        xhr.send();
    }

    function saveNewMembers(text) {
        let blob = new Blob([text], {type: 'text/plain'});

        var a = document.createElement('a');
        a.style = 'display: none';
        a.href = window.URL.createObjectURL(blob);
        a.download = 'newMembers.csv';

        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
}());
