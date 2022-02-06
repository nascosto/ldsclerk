javascript:(function () {
    const membersWithCallingsUrl = 'https://lcr.churchofjesuschrist.org/services/report/members-with-callings';
    const subOrgNameHeirarchyUrl = 'https://lcr.churchofjesuschrist.org/services/orgs/sub-org-name-hierarchy';

    let subOrgsAsMembers = [];

    generateCallingsList();

    function generateCallingsList() {
        requestJson(subOrgNameHeirarchyUrl, onGetSubOrgNameHeirarchySuccess, () => console.error('Failed to get sub-org name heirarchy.'));
    }

    function onGetSubOrgNameHeirarchySuccess(subOrgs) {
        subOrgsAsMembers = getSubOrgsAsMembers(subOrgs, null);
        requestJson(membersWithCallingsUrl, onGetMembersWithCallingsSuccess, () => console.error('Failed to get member calling list.'));
    }

    function getSubOrgsAsMembers(subOrgs, parent) {
        let subOrgsAsMembers = [];
        for (let subOrg of subOrgs) {
            let childrenAsMembers = getSubOrgsAsMembers(subOrg.children, subOrg);
            subOrgsAsMembers = subOrgsAsMembers.concat(childrenAsMembers);
            let subOrgAsMember = {
                id: subOrg.subOrgId,
                name: subOrg.name,
                organization: parent ? parent.name : subOrg.name,
                parentSubOrgId: parent ? parent.subOrgId : null,
                position: subOrg.name,
                spokenName: subOrg.name,
                subOrgId: subOrg.subOrgId,
                supervisorId: parent ? parent.subOrgId : null,
            };
            subOrgsAsMembers.push(subOrgAsMember);
        }
        console.info("I got here 2");
        return subOrgsAsMembers;
    }

    function onGetMembersWithCallingsSuccess(members) {
        setSupervisors(members);
        members = members.concat(subOrgsAsMembers);

        let headers = getHeaders(members);

        let csv = sanitize(headers).join(',') + '\n';

        for (let member of members) {
            csv += getRow(member, headers) + '\n';
        }
        saveNewMembers(csv);
    }

    function setSupervisors(members) {
        for (let member of members) {
            member.supervisorId = member.subOrgId;
        }
    }

    function getHeaders(members) {
        if (members.length === 0) {
            return [];
        }
        return Object.keys(members[0]);
    }

    function getRow(member, headers) {
        return headers.map(header => sanitize(member[header])).join(',');
    }

    function sanitize(value) {
        if (Array.isArray(value)) {
            return value.map(v => {
                if (isString(v)) {
                    return '"' + v + '"';
                }
                return v;
            });
        } else if (isString(value)) {
            return '"' + value + '"';
        }
        return value;
    }

    function isString(value) {
        return typeof value === 'string' || value instanceof String;
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
        a.download = 'membersWithCallings.csv';

        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
}());
